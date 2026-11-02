import { ApiProperty } from '@nestjs/swagger';

/*
 * Esquemas de las respuestas de error, todas con la forma { statusCode, error, message }.
 * Se define una clase por código HTTP para que cada respuesta documentada en Swagger
 * muestre su propio ejemplo (un 404 no debe ilustrarse con un mensaje de un 400).
 */

export class BadRequestErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    description: 'Mensaje o lista de mensajes de validación',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['endDate no puede ser anterior a startDate'],
  })
  message: string | string[];
}

export class NotFoundErrorDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'No existe la estación con id 99' })
  message: string;
}

export class ConflictErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({
    example: 'La estación MZL-01 ya registró TEMPERATURE en 2026-10-31T13:00:00.000Z',
  })
  message: string;
}

export class UnprocessableEntityErrorDto {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({ example: 'Unprocessable Entity' })
  error: string;

  @ApiProperty({ example: 'La estación MZL-01 está inactiva y no puede registrar mediciones' })
  message: string;
}

export class ServiceUnavailableErrorDto {
  @ApiProperty({ example: 503 })
  statusCode: number;

  @ApiProperty({ example: 'Service Unavailable' })
  error: string;

  @ApiProperty({ example: 'La base de datos no responde' })
  message: string;
}
