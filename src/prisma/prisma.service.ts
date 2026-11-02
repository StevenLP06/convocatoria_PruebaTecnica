import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { type EnvironmentVariables, NodeEnvironment } from '../config/env.validation';

/**
 * Cliente de Prisma gestionado por el ciclo de vida de NestJS.
 * Abre la conexión al iniciar el módulo y la cierra al apagar la aplicación.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const isDevelopment =
      configService.get('NODE_ENV', { infer: true }) === NodeEnvironment.Development;

    super({
      datasourceUrl: configService.get('DATABASE_URL', { infer: true }),
      log: isDevelopment ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión a PostgreSQL establecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Conexión a PostgreSQL cerrada');
  }
}
