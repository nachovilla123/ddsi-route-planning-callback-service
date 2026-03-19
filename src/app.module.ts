import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { GroupsModule } from './groups/groups.module';
import { IngestionModule } from './ingestion/ingestion.module';
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
    DatabaseModule,
    SharedModule,
    GroupsModule,
    IngestionModule,
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
