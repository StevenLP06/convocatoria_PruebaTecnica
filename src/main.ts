import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { type EnvironmentVariables } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);

  // Rutas bajo /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Cierre ordenado (SIGTERM/SIGINT), necesario para contenedores Docker.
  app.enableShutdownHooks();

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  Logger.log(`API escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
