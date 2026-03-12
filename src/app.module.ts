import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './shared/shared.module';
import { GroupsModule } from './groups/groups.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PlanningModule } from './planning/planning.module';
import { DispatchModule } from './dispatch/dispatch.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SharedModule,
    GroupsModule,
    IngestionModule,
    PlanningModule,
    DispatchModule,
  ],
})
export class AppModule {}
