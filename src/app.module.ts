import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './shared/shared.module';
import { GroupsModule } from './groups/groups.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PlanningModule } from './planning/planning.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';

import { HealthController } from './health.controller';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyThrottlerGuard } from './shared/guards/api-key-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    ScheduleModule.forRoot(),
    SharedModule,
    GroupsModule,
    IngestionModule,
    PlanningModule,
    DispatchModule,
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyThrottlerGuard,
    },
  ],
})
export class AppModule {}
