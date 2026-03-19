import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { WebhookOutbox } from './entities/webhook-outbox.entity';
import { StudentGroup } from '../groups/entities/student-group.entity';
import { DispatchService } from './services/dispatch.service';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([WebhookOutbox, StudentGroup]),
  ],
  providers: [DispatchService],
})
export class DispatchModule {}
