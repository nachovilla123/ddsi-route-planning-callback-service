import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { RoutingRequest } from '../../ingestion/entities/routing-request.entity';
import { VrpWorkerService } from './vrp-worker.service';
import { randomUUID } from 'crypto';
import { RoutingStatus } from 'src/ingestion/entities/routing-status.enum';
import { WebhookStatus } from 'src/dispatch/entities/webhook-status.enum';

@Injectable()
export class PlanningService {
  private readonly logger = new Logger(PlanningService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly vrpWorker: VrpWorkerService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processNext(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      //todo: no es la opcion mas mantenible.
      const rows: RoutingRequest[] = (await runner.query(
        `SELECT * FROM routing_requests
         WHERE status = $1
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [RoutingStatus.PENDING],
      )) as RoutingRequest[];

      if (!rows.length) {
        await runner.rollbackTransaction();
        return;
      }

      // buscamos un array pero con un solo elemento, se accede al primero con [0]
      const req = rows[0];

      await runner.query(
        `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [RoutingStatus.PROCESSING, req.id],
      );
      await runner.commitTransaction();

      // Run VRP in worker thread (outside transaction to avoid holding the lock)
      const { warehouse, deliveries, trucks } = req.payload;

      //todo revisar: esto lo mapea a la clase porque estaba embebido.
      const routePlanningResult = await this.vrpWorker.run(
        {
          lat: warehouse.latitude,
          lon: warehouse.longitude,
          address: warehouse.address,
        },
        deliveries.map((d) => ({
          deliveryCode: d.deliveryCode,
          lat: d.latitude,
          lon: d.longitude,
          weightKg: d.WeightKg,
          volumeM3: d.VolumeM3,
        })),
        trucks.map((t) => ({
          truckId: t.truckId,
          weightCapacityKg: t.WeightCapacityKg,
          volumeCapacityM3: t.VolumeCapacityM3,
        })),
      );

      const runner2 = this.dataSource.createQueryRunner();
      await runner2.connect();
      await runner2.startTransaction();
      try {
        await runner2.query(
          `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
          [RoutingStatus.COMPLETED, req.id],
        );

        const outboxPayload = {
          event_id: `evt_${randomUUID()}`,
          event_type: 'routing.completed',
          request_id: req.id,
          timestamp: new Date().toISOString(),
          data: routePlanningResult,
        };

        await runner2.query(
          `INSERT INTO webhook_outbox (id, request_id, api_key, payload, status, retry_count, next_attempt_at)
           VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
          [
            randomUUID(),
            req.id,
            req.apiKey,
            JSON.stringify(outboxPayload),
            WebhookStatus.PENDING,
          ],
        );
        await runner2.commitTransaction();
      } catch (err) {
        await runner2.rollbackTransaction();
        await this.dataSource.query(
          `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
          [RoutingStatus.FAILED, req.id],
        );
        throw err;
      } finally {
        await runner2.release();
      }
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error('VRP processing error', err);
    } finally {
      await runner.release();
    }
  }
}
