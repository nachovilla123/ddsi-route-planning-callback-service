import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { WebhookOutbox } from '../entities/webhook-outbox.entity';
import { StudentGroup } from '../../groups/entities/student-group.entity';
import { sign } from '../utils/hmac-signer';
import { nextAttemptAt } from '../utils/backoff';
import { WebhookStatus } from '../entities/webhook-status.enum';

const MAX_RETRIES = 5;

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async dispatchNext(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const rows: WebhookOutbox[] = await runner.query(
        `SELECT * FROM webhook_outbox
         WHERE status = 'PENDING' AND next_attempt_at <= NOW()
         ORDER BY next_attempt_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
      );

      if (!rows.length) {
        await runner.rollbackTransaction();
        return;
      }

      const outbox = rows[0];
      await runner.commitTransaction();

      const groups: StudentGroup[] = await runner.query(
        `SELECT * FROM student_groups WHERE id = $1`,
        [outbox.groupId],
      );

      const group = groups[0];
      if (!group) {
        this.logger.warn(`No group found for id ${outbox.groupId}`);
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
        delivered = false;
      }

      if (delivered) {
        await this.dataSource.query(
          `UPDATE webhook_outbox SET status = $1 WHERE id = $2`,
          [WebhookStatus.DELIVERED, outbox.id],
        );
      } else {
        const newRetryCount = outbox.retryCount + 1;
        if (newRetryCount >= MAX_RETRIES) {
          await this.dataSource.query(
            `UPDATE webhook_outbox SET status = $1, retry_count = $2 WHERE id = $3`,
            [WebhookStatus.FAILED, newRetryCount, outbox.id],
          );
        } else {
          await this.dataSource.query(
            `UPDATE webhook_outbox SET retry_count = $1, next_attempt_at = $2 WHERE id = $3`,
            [newRetryCount, nextAttemptAt(newRetryCount), outbox.id],
          );
        }
      }
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error('Dispatch error', err);
    } finally {
      await runner.release();
    }
  }
}
