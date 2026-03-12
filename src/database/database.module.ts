import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StudentGroup } from '../groups/entities/student-group.entity';
import { RoutingRequest } from '../ingestion/entities/routing-request.entity';
import { WebhookOutbox } from '../dispatch/entities/webhook-outbox.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'route_generator'),
        entities: [StudentGroup, RoutingRequest, WebhookOutbox],
        //todo: si llego, configurar migrations y sacar el synchronize.
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
