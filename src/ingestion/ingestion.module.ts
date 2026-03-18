import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutingRequest } from './entities/routing-request.entity';
import { StudentGroup } from '../groups/entities/student-group.entity';
import { IngestionService } from './services/ingestion.service';
import { IngestionController } from './controllers/ingestion.controller';
import { GroupsModule } from '../groups/groups.module';
import { WebhookOutbox } from 'src/dispatch/entities/webhook-outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoutingRequest, StudentGroup, WebhookOutbox]),
    GroupsModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
