import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './shared/shared.module';
import { GroupsModule } from './groups/groups.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PlanningModule } from './planning/planning.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { DatabaseModule } from './database/database.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SharedModule,
    GroupsModule,
    IngestionModule,
    PlanningModule,
    DispatchModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
