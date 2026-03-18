import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VrpWorkerService } from './vrp-worker.service';
import { randomUUID } from 'crypto';

import { RoutingStatus } from '../../ingestion/entities/routing-status.enum';
import { WebhookStatus } from '../../dispatch/entities/webhook-status.enum';
import { RoutingRequest } from '../../ingestion/entities/routing-request.entity';
import { WebhookOutbox } from '../../dispatch/entities/webhook-outbox.entity';
import { PlanningResult } from '../utils/greedy-route-planner';
import { envConfig } from 'src/config/env.config';

import type { RoutingPayload } from '../../ingestion/entities/routing-payload';

interface RawRoutingRequest {
  id: string;
  group_id: string;
  payload: RoutingPayload;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PlanningService {
  private readonly logger = new Logger(PlanningService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly vrpWorker: VrpWorkerService,
    @InjectRepository(RoutingRequest)
    private readonly requestsRepo: Repository<RoutingRequest>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processNext(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    let processingRequests: RawRoutingRequest[] = [];
    try {
      processingRequests = (await runner.query(
        `SELECT * FROM routing_requests
         WHERE status = $1
         ORDER BY created_at ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED`,
        [RoutingStatus.PENDING, envConfig.planning.planningBatchSize],
      )) as RawRoutingRequest[];

      if (!processingRequests.length) {
        await runner.rollbackTransaction();
        return;
      }

      const requestIds = processingRequests.map((r) => r.id);
      await runner.query(
        `UPDATE routing_requests SET status = $1 WHERE id = ANY($2)`,
        [RoutingStatus.PROCESSING, requestIds],
      );

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error('Error extrayendo el lote de routing_requests', err);
      return;
    } finally {
      await runner.release();
    }

    const planningPromises = processingRequests.map(async (request) => {
      let routePlanningResult: PlanningResult | null = null;

      try {
        const payload = request.payload;

        routePlanningResult = await this.vrpWorker.run(
          payload.timeWindow,
          {
            lat: payload.warehouse.latitude,
            lon: payload.warehouse.longitude,
            address: payload.warehouse.address,
          },
          payload.deliveries.map((d) => ({
            deliveryCode: d.deliveryCode,
            lat: d.latitude,
            lon: d.longitude,
            address: d.address,
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
          `Error en el Worker VRP para el request ${request.id}`,
          workerErr,
        );
        await this.requestsRepo.update(request.id, {
          status: RoutingStatus.FAILED,
        });
        return;
      }

      const saveRunner = this.dataSource.createQueryRunner();
      await saveRunner.connect();
      await saveRunner.startTransaction();

      try {
        await saveRunner.manager.update(RoutingRequest, request.id, {
          status: RoutingStatus.COMPLETED,
        });

        const outboxPayload = {
          event_id: `evt_${randomUUID()}`,
          event_type: 'routing.completed',
          request_id: request.id,
          timestamp: new Date().toISOString(),
          data: routePlanningResult,
        };

        const newOutboxEntry = saveRunner.manager.create(WebhookOutbox, {
          id: randomUUID(),
          requestId: request.id,
          groupId: request.group_id,
          payload: outboxPayload,
          status: WebhookStatus.PENDING,
          retryCount: 0,
          nextAttemptAt: new Date(),
        });
        await saveRunner.manager.save(newOutboxEntry);

        await saveRunner.commitTransaction();
      } catch (err: unknown) {
        await saveRunner.rollbackTransaction();
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `No se pudo guardar el webhook para request ${request.id}. ${message}`,
        );
        await this.requestsRepo.update(request.id, {
          status: RoutingStatus.FAILED,
        });
      } finally {
        await saveRunner.release();
      }
    });

    await Promise.allSettled(planningPromises);
  }
}
