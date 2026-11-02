import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { validateEnvironment } from './config/env.validation';
import { MeasurementsModule } from './measurements/measurements.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { PrismaModule } from './prisma/prisma.module';
import { StationsModule } from './stations/stations.module';
import { VariablesModule } from './variables/variables.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    MunicipalitiesModule,
    StationsModule,
    VariablesModule,
    MeasurementsModule,
    AnalyticsModule,
  ],
  providers: [
    {
      // Registrados como providers (y no en main.ts) para que también apliquen en pruebas e2e.
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
