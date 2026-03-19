import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');

  app.use(json({ limit: '5mb' }));

  app.use(urlencoded({ extended: true, limit: '5mb' }));

  const config = new DocumentBuilder()
    .setTitle('Route Generator API')
    .setDescription(
      `API para la generacion de rutas de entrega 
      
      ### 📅 Formato de Fechas
Todas las fechas y horas en esta API (tanto en las peticiones como en las respuestas y webhooks) utilizan el estándar **ISO-8601 en zona horaria UTC** (ejemplo: \`2026-03-18T08:00:00.000Z\`).`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(envConfig.port);
}
bootstrap().catch(console.error);
