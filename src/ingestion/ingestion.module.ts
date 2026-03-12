import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutingRequest } from './entities/routing-request.entity';
import { StudentGroup } from '../groups/entities/student-group.entity';
import { IngestionService } from './services/ingestion.service';
import { IngestionController } from './controllers/ingestion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoutingRequest, StudentGroup])],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
