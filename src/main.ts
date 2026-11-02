import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { type EnvironmentVariables } from './config/env.validation';
import { SWAGGER_PATH, setupSwagger } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);

  configureApp(app);
  setupSwagger(app);

  // Cierre ordenado (SIGTERM/SIGINT), necesario para contenedores Docker.
  app.enableShutdownHooks();

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  Logger.log(`API escuchando en http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Documentación en http://localhost:${port}/${SWAGGER_PATH}`, 'Bootstrap');
}

void bootstrap();
