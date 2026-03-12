import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookOutbox } from './entities/webhook-outbox.entity';
import { StudentGroup } from '../groups/entities/student-group.entity';
import { DispatchService } from './services/dispatch.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookOutbox, StudentGroup])],
  providers: [DispatchService],
})
export class DispatchModule {}
