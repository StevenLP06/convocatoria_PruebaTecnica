import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Variables de entorno requeridas por la aplicación.
 * Se validan al arrancar: si alguna es inválida la app falla de inmediato (fail-fast)
 * en lugar de fallar más tarde en tiempo de ejecución.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL debe ser una cadena de conexión de PostgreSQL (postgresql://...)',
  })
  DATABASE_URL: string;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors.flatMap((error) => Object.values(error.constraints ?? {})).join('; ');
    throw new Error(`Configuración de entorno inválida: ${details}`);
  }

  return validatedConfig;
}
