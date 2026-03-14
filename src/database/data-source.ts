// src/database/data-source.ts
import { DataSource } from 'typeorm';
import { envConfig } from '../config/env.config';

export default new DataSource({
  type: 'postgres',
  host: envConfig.db.host,
  port: envConfig.db.port,
  username: envConfig.db.user,
  password: envConfig.db.pass,
  database: envConfig.db.name,
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
