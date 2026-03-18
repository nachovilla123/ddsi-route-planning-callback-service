import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, Repository } from 'typeorm';
import { WebhookOutbox } from '../entities/webhook-outbox.entity';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { sign } from '../utils/hmac-signer';
import { nextAttemptAt } from '../utils/backoff';
import { WebhookStatus } from '../entities/webhook-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { envConfig } from 'src/config/env.config';

interface RawOutbox {
  id: string;
  group_id: string;
  payload: any;
  retry_count: number;
  next_attempt_at: Date;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(WebhookOutbox)
    private readonly outboxRepo: Repository<WebhookOutbox>,
    @InjectRepository(StudentGroup)
    private readonly groupRepo: Repository<StudentGroup>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async dispatchNext(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    let outboxes: RawOutbox[] = [];

    try {
      outboxes = (await runner.query(
        `SELECT * FROM webhook_outbox
         WHERE status = 'PENDING' AND next_attempt_at <= NOW()
         ORDER BY next_attempt_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [envConfig.webhook.dispatchBatchSize],
      )) as unknown as RawOutbox[];

      if (!outboxes.length) {
        await runner.rollbackTransaction();
        return;
      }

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error('Error al leer de webhook_outbox', err);
      return;
    } finally {
      await runner.release();
    }

    const dispatchPromises = outboxes.map(async (outbox) => {
      try {
        const group = await this.groupRepo.findOneBy({ id: outbox.group_id });

        if (!group) {
          this.logger.warn(`Grupo no encontrado para webhook ${outbox.id}`);
          await this.outboxRepo.update(outbox.id, {
            status: WebhookStatus.FAILED,
          });
          return;
        }

        const body = JSON.stringify(outbox.payload);
        const signature = sign(body, group.clientSecret);

        let delivered = false;
        try {
          const response = await fetch(group.callbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': signature,
            },
            body,
            signal: AbortSignal.timeout(envConfig.webhook.timeoutMs),
          });
          delivered = response.ok;
        } catch {
          delivered = false;
        }

        if (delivered) {
          await this.outboxRepo.update(outbox.id, {
            status: WebhookStatus.DELIVERED,
          });
        } else {
          const newRetryCount = outbox.retry_count + 1;
          if (newRetryCount >= envConfig.webhook.maxRetries) {
            await this.outboxRepo.update(outbox.id, {
              status: WebhookStatus.FAILED,
              retryCount: newRetryCount,
            });
          } else {
            await this.outboxRepo.update(outbox.id, {
              retryCount: newRetryCount,
              nextAttemptAt: nextAttemptAt(newRetryCount),
            });
          }
        }
      } catch (err) {
        this.logger.error(
          `Fallo catastrófico en worker individual para ID ${outbox.id}`,
          err,
        );
      }
    });

    await Promise.allSettled(dispatchPromises);
  }
}
