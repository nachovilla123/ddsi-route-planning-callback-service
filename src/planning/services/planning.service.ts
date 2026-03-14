import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { VrpWorkerService } from './vrp-worker.service';
import { randomUUID } from 'crypto';

import { RoutingStatus } from '../../ingestion/entities/routing-status.enum';
import { WebhookStatus } from '../../dispatch/entities/webhook-status.enum';
import { RoutingRequest } from 'src/ingestion/entities/routing-request.entity';
import { PlanningResult } from '../utils/greedy-route-planner';

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

    let processingRequest: RoutingRequest;

    //TODO: pensar en un batch de liite 5 con thread pool
    try {
      const rows = (await runner.query(
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

      processingRequest = rows[0];

      await runner.query(
        `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [RoutingStatus.PROCESSING, processingRequest.id],
      );

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error('Error Setting transaction as PROCESSING', err);
      return;
    } finally {
      await runner.release();
    }

    if (!processingRequest) return;

    let routePlanningResult: PlanningResult | null = null;
    try {
      const payload = processingRequest.payload;

      routePlanningResult = await this.vrpWorker.run(
        {
          lat: payload.warehouse.latitude,
          lon: payload.warehouse.longitude,
          address: payload.warehouse.address,
        },
        payload.deliveries.map((d) => ({
          deliveryCode: d.deliveryCode,
          lat: d.latitude,
          lon: d.longitude,
          weightKg: d.WeightKg,
          volumeM3: d.VolumeM3,
        })),
        payload.trucks.map((t) => ({
          truckId: t.truckId,
          weightCapacityKg: t.WeightCapacityKg,
          volumeCapacityM3: t.VolumeCapacityM3,
        })),
      );
    } catch (workerErr) {
      this.logger.error(
        `Error in Worker VRP for request ${processingRequest.id}`,
        workerErr,
      );
      await this.dataSource.query(
        `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [RoutingStatus.FAILED, processingRequest.id],
      );
      return;
    }

    const runner2 = this.dataSource.createQueryRunner();
    await runner2.connect();
    await runner2.startTransaction();

    try {
      await runner2.query(
        `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [RoutingStatus.COMPLETED, processingRequest.id],
      );

      const outboxPayload = {
        event_id: `evt_${randomUUID()}`,
        event_type: 'routing.completed',
        request_id: processingRequest.id,
        timestamp: new Date().toISOString(),
        data: routePlanningResult,
      };

      console.log(`Worker result: ${JSON.stringify(routePlanningResult)}`);

      await runner2.query(
        `INSERT INTO webhook_outbox (id, request_id, group_id, payload, status, retry_count, next_attempt_at)
         VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
        [
          randomUUID(),
          processingRequest.id,
          processingRequest.groupId,
          outboxPayload,
          WebhookStatus.PENDING,
        ],
      );

      await runner2.commitTransaction();
    } catch (err: unknown) {
      await runner2.rollbackTransaction();
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Could not save webhook for request ${processingRequest.id}. ${message}`,
      );

      await this.dataSource.query(
        `UPDATE routing_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [RoutingStatus.FAILED, processingRequest.id],
      );
    } finally {
      await runner2.release();
    }
  }
}
