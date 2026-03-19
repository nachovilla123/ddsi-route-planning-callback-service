import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentGroup } from '../groups/entities/student-group.entity';
import { RoutingRequest } from '../ingestion/entities/routing-request.entity';
import { WebhookOutbox } from '../dispatch/entities/webhook-outbox.entity';
import { envConfig } from '../config/env.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envConfig.db.host,
      port: envConfig.db.port,
      username: envConfig.db.user,
      password: envConfig.db.pass,
      database: envConfig.db.name,
      entities: [StudentGroup, RoutingRequest, WebhookOutbox],
      synchronize: false,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: false,
      extra: {
        max: envConfig.db.poolSize,
      },
    }),
  ],
})
export class DatabaseModule {}
