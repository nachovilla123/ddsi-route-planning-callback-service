import { NestFactory } from '@nestjs/core';
import { DispatchModule } from './dispatch/dispatch.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerDispatchBootstrap');

  const app = await NestFactory.createApplicationContext(DispatchModule);

  await app.init();

  logger.log('Worker de Envío de Webhooks iniciado correctamente');

  app.enableShutdownHooks();
}
bootstrap().catch((err) => {
  console.error('Error fatal al iniciar el Worker de Dispatch', err);
  process.exit(1);
});
