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
import { RawOutbox } from '../utils/types/raw-outbox.interface';

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
    this.logger.debug('Iniciando ciclo de DispatchService...');

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    let outboxes: RawOutbox[] = [];

    try {
      this.logger.debug('Buscando webhooks pendientes o zombies...');

      outboxes = (await runner.query(
        `SELECT * FROM webhook_outbox
         WHERE (status = $1 AND next_attempt_at <= NOW())
            OR (status = $2 AND updated_at < NOW() - INTERVAL '1 minute')
         ORDER BY next_attempt_at ASC
         LIMIT $3
         FOR UPDATE SKIP LOCKED`,
        [
          WebhookStatus.PENDING,
          WebhookStatus.PROCESSING,
          envConfig.webhook.dispatchBatchSize,
        ],
      )) as unknown as RawOutbox[];

      if (!outboxes.length) {
        this.logger.debug(
          'No se encontraron webhooks para procesar en este ciclo.',
        );
        await runner.rollbackTransaction();
        return;
      }

      const outboxIds = outboxes.map((o) => o.id);
      this.logger.log(
        `Se encontraron ${outboxIds.length} webhooks. Marcando como PROCESSING...`,
      );

      await runner.query(
        `UPDATE webhook_outbox SET status = 'PROCESSING', updated_at = NOW() WHERE id = ANY($1)`,
        [outboxIds],
      );

      await runner.commitTransaction();
      this.logger.debug('Transacción de DB comiteada. Candados liberados.');
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error(
        'Error al leer/actualizar webhook_outbox durante la transacción',
        err,
      );
      return;
    } finally {
      await runner.release();
    }

    this.logger.log(`Iniciando envío HTTP para ${outboxes.length} webhooks...`);

    const dispatchPromises = outboxes.map(async (outbox) => {
      try {
        this.logger.debug(
          `Procesando webhook ID: ${outbox.id} para el grupo: ${outbox.group_id}`,
        );

        const group = await this.groupRepo.findOneBy({ id: outbox.group_id });

        if (!group) {
          this.logger.warn(
            `Grupo no encontrado para webhook ${outbox.id}. Marcando como FAILED.`,
          );
          await this.outboxRepo.update(outbox.id, {
            status: WebhookStatus.FAILED,
          });
          return;
        }

        const body = JSON.stringify(outbox.payload);
        const signature = sign(body, group.clientSecret);

        let delivered = false;

        this.logger.debug(
          `Haciendo fetch a la URL: ${group.callbackUrl} (Webhook ID: ${outbox.id})`,
        );

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

          if (delivered) {
            this.logger.log(
              `Fetch exitoso (Status: ${response.status}) para webhook ID: ${outbox.id}`,
            );
          } else {
            this.logger.warn(
              `Fetch rechazado (Status: ${response.status}) para webhook ID: ${outbox.id}`,
            );
          }
        } catch (fetchErr) {
          this.logger.warn(
            `Fetch fallido (Timeout/Error de red) para webhook ID: ${outbox.id} motivo ${fetchErr}`,
          );
          delivered = false;
        }

        if (delivered) {
          this.logger.debug(
            `Actualizando estado a DELIVERED para webhook ID: ${outbox.id}`,
          );
          await this.outboxRepo.update(outbox.id, {
            status: WebhookStatus.DELIVERED,
          });
          this.logger.log(`Webhook ID: ${outbox.id} entregado correctamente.`);
        } else {
          const newRetryCount = outbox.retry_count + 1;
          this.logger.debug(
            `Intento fallido ${newRetryCount}/${envConfig.webhook.maxRetries} para webhook ID: ${outbox.id}`,
          );

          if (newRetryCount >= envConfig.webhook.maxRetries) {
            this.logger.warn(
              `Se superó el límite de reintentos para webhook ID: ${outbox.id}. Marcando como FAILED.`,
            );
            await this.outboxRepo.update(outbox.id, {
              status: WebhookStatus.FAILED,
              retryCount: newRetryCount,
            });
          } else {
            const nextAttempt = nextAttemptAt(newRetryCount);
            this.logger.debug(
              `Programando próximo reintento para webhook ID: ${outbox.id} a las ${nextAttempt.toISOString()}`,
            );
            await this.outboxRepo.update(outbox.id, {
              status: WebhookStatus.PENDING,
              retryCount: newRetryCount,
              nextAttemptAt: nextAttempt,
            });
          }
        }
      } catch (err) {
        this.logger.error(
          `Fallo catastrófico en la ejecución del worker para webhook ID: ${outbox.id}`,
          err,
        );
        await this.outboxRepo.update(outbox.id, {
          status: WebhookStatus.FAILED,
        });
      }
    });

    await Promise.allSettled(dispatchPromises);
    this.logger.log('Ciclo de DispatchService finalizado.');
  }
}
