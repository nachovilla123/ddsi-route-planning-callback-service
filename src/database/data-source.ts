import { DataSource } from 'typeorm';
import { envConfig } from '../config/env.config';

const isTs = __filename.endsWith('.ts');

export default new DataSource({
  type: 'postgres',
  host: envConfig.db.host,
  port: envConfig.db.port,
  username: envConfig.db.user,
  password: envConfig.db.pass,
  database: envConfig.db.name,
  entities: [isTs ? 'src/**/*.entity.ts' : 'dist/**/*.entity.js'],
  migrations: [
    isTs ? 'src/database/migrations/*.ts' : 'dist/database/migrations/*.js',
  ],
  synchronize: false,
  extra: {
    max: envConfig.db.poolSize,
  },
});
