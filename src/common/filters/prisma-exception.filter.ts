import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { type Response } from 'express';

interface MappedPrismaError {
  status: HttpStatus;
  error: string;
  message: string;
}

/**
 * Traduce errores conocidos de Prisma a respuestas HTTP coherentes.
 * Es una red de seguridad: los servicios validan los casos esperados y lanzan
 * excepciones HTTP con mensajes específicos; este filtro cubre lo restante para
 * que nunca se exponga un error interno de base de datos como 500 genérico.
 *
 * Códigos: https://www.prisma.io/docs/orm/reference/error-reference
 */
const PRISMA_ERROR_MAP: Partial<Record<string, MappedPrismaError>> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message: 'Ya existe un registro con los mismos valores únicos',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    message: 'La referencia a un registro relacionado no es válida',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
    message: 'El registro solicitado no existe',
  },
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = PRISMA_ERROR_MAP[exception.code];

    if (!mapped) {
      this.logger.error(`Error de Prisma no controlado (${exception.code})`, exception.stack);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
      });
      return;
    }

    response.status(mapped.status).json({
      statusCode: mapped.status,
      error: mapped.error,
      message: mapped.message,
    });
  }
}
