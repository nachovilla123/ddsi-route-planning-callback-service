import { NestFactory } from '@nestjs/core';
import { PlanningModule } from './planning/planning.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerPlanningBootstrap');

  const app = await NestFactory.createApplicationContext(PlanningModule);

  await app.init();

  logger.log('Worker de Planificación Matemática iniciado correctamente');

  app.enableShutdownHooks();
}
bootstrap().catch((err) => {
  console.error('Error fatal al iniciar el Worker de Planificación', err);
  process.exit(1);
});
