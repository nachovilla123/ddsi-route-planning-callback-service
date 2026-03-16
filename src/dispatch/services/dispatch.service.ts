import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { WebhookOutbox } from '../entities/webhook-outbox.entity';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { sign } from '../utils/hmac-signer';
import { nextAttemptAt } from '../utils/backoff';
import { WebhookStatus } from '../entities/webhook-status.enum';
import { InjectRepository } from '@nestjs/typeorm';

const MAX_RETRIES = 5;

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
    const runner: QueryRunner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    let outbox: RawOutbox | null = null;

    try {
      const rows = (await runner.query(
        `SELECT * FROM webhook_outbox
         WHERE status = 'PENDING' AND next_attempt_at <= NOW()
         ORDER BY next_attempt_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
      )) as unknown as RawOutbox[];

      if (!rows.length) {
        await runner.rollbackTransaction();
        return;
      }

      outbox = rows[0];

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error('Error al leer de webhook_outbox', err);
      return;
    } finally {
      await runner.release();
    }

    if (!outbox) return;

    try {
      const group = await this.groupRepo.findOneBy({ id: outbox.group_id });

      if (!group) {
        this.logger.warn(`No group found for id ${outbox.group_id}`);
        await this.dataSource.query(
          `UPDATE webhook_outbox SET status = $1 WHERE id = $2`,
          [WebhookStatus.FAILED, outbox.id],
        );
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
        });
        delivered = response.ok;
      } catch {
        delivered = false; // El servidor del alumno está apagado o no resuelve el DNS
      }

      if (delivered) {
        await this.outboxRepo.update(outbox.id, {
          status: WebhookStatus.DELIVERED,
        });
      } else {
        const newRetryCount = outbox.retry_count + 1;
        if (newRetryCount >= MAX_RETRIES) {
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
      this.logger.error('Dispatch error', err);
    }
  }
}
