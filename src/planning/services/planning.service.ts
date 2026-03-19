import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { RoutingStatus } from '../../ingestion/entities/routing-status.enum';
import { WebhookStatus } from '../../dispatch/entities/webhook-status.enum';
import { RoutingRequest } from '../../ingestion/entities/routing-request.entity';
import { WebhookOutbox } from '../../dispatch/entities/webhook-outbox.entity';
import { planRoutes, PlanningResult } from '../utils/greedy-route-planner';
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
    @InjectRepository(RoutingRequest)
    private readonly requestsRepo: Repository<RoutingRequest>,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processNext(): Promise<void> {
    this.logger.debug('Iniciando ciclo de PlanningService...');

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    let processingRequests: RawRoutingRequest[] = [];

    try {
      this.logger.debug('Buscando rutas PENDING o PROCESSING (zombies)...');
      processingRequests = (await runner.query(
        `SELECT * FROM routing_requests
         WHERE status = $1
            OR (status = $2 AND updated_at < NOW() - INTERVAL '5 minutes')
         ORDER BY created_at ASC
         LIMIT $3
         FOR UPDATE SKIP LOCKED`,
        [
          RoutingStatus.PENDING,
          RoutingStatus.PROCESSING,
          envConfig.planning.planningBatchSize,
        ],
      )) as RawRoutingRequest[];

      if (!processingRequests.length) {
        this.logger.debug('No hay rutas pendientes de cálculo.');
        await runner.rollbackTransaction();
        return;
      }

      const requestIds = processingRequests.map((r) => r.id);
      this.logger.log(
        `Se bloquearon ${requestIds.length} solicitudes. Marcando como PROCESSING...`,
      );

      await runner.query(
        `UPDATE routing_requests SET status = $2, updated_at = NOW() WHERE id = ANY($1)`,
        [requestIds, RoutingStatus.PROCESSING],
      );
      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error(
        'Error al extraer lote de routing_requests de la base de datos',
        err,
      );
      return;
    } finally {
      await runner.release();
    }

    for (const request of processingRequests) {
      this.logger.log(`[REQ: ${request.id}] Iniciando cálculo matemático...`);
      const startTime = performance.now();
      let routePlanningResult: PlanningResult | null = null;

      try {
        const payload = request.payload;

        routePlanningResult = planRoutes(
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
          payload.trucks,
        );

        const endTime = performance.now();
        this.logger.debug(
          `[REQ: ${request.id}] Cálculo finalizado en ${(endTime - startTime).toFixed(2)}ms`,
        );
      } catch (mathErr) {
        this.logger.error(
          `[REQ: ${request.id}] Excepción lanzada por el motor matemático.`,
          mathErr,
        );
        await this.requestsRepo.update(request.id, {
          status: RoutingStatus.FAILED,
        });
        continue;
      }

      const saveRunner = this.dataSource.createQueryRunner();
      await saveRunner.connect();
      await saveRunner.startTransaction();

      try {
        this.logger.debug(
          `[REQ: ${request.id}] Guardando estado COMPLETED y encolando webhook...`,
        );

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
        this.logger.log(
          `[REQ: ${request.id}] Procesamiento exitoso. Webhook listo para dispatch.`,
        );
      } catch (err: unknown) {
        await saveRunner.rollbackTransaction();
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `[REQ: ${request.id}] Fallo crítico al guardar el resultado en BD: ${message}`,
          err,
        );
        await this.requestsRepo.update(request.id, {
          status: RoutingStatus.FAILED,
        });
      } finally {
        await saveRunner.release();
      }
    }

    this.logger.log('Lote matemático procesado por completo.');
  }
}
