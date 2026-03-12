import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutingRequest } from '../ingestion/entities/routing-request.entity';
import { WebhookOutbox } from '../dispatch/entities/webhook-outbox.entity';
import { PlanningService } from './services/planning.service';
import { VrpWorkerService } from './services/vrp-worker.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoutingRequest, WebhookOutbox])],
  providers: [PlanningService, VrpWorkerService],
})
export class PlanningModule {}
