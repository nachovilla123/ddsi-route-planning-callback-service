import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { RoutingRequest } from '../ingestion/entities/routing-request.entity';
import { WebhookOutbox } from '../dispatch/entities/webhook-outbox.entity';
import { PlanningService } from './services/planning.service';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RoutingRequest, WebhookOutbox]),
  ],
  providers: [PlanningService],
})
export class PlanningModule {}
