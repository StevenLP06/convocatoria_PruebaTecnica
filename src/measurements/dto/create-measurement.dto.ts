import { ApiProperty } from '@nestjs/swagger';
import { VariableCode } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { MAX_INT_ID } from '../../common/constants/app.constants';
import { toUpperCase } from '../../common/utils/query-transform.util';
import { IsDateTimeWithOffset } from '../../common/validators/date.validators';

export class CreateMeasurementDto {
  @ApiProperty({ description: 'Estación que registra la medición (id)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(MAX_INT_ID)
  stationId: number;

  @ApiProperty({
    description: 'Variable medida (no distingue mayúsculas)',
    enum: VariableCode,
    enumName: 'VariableCode',
    example: VariableCode.TEMPERATURE,
  })
  @Transform(toUpperCase)
  @IsEnum(VariableCode, {
    message: `variable debe ser uno de: ${Object.values(VariableCode).join(', ')}`,
  })
  variable: VariableCode;

  @ApiProperty({
    description:
      'Valor medido en la unidad de la variable, con máximo 2 decimales. ' +
      'Debe estar dentro del rango físicamente posible de la variable.',
    example: 18.4,
  })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'value debe ser un número con máximo 2 decimales' },
  )
  value: number;

  @ApiProperty({
    description: 'Instante de la medición: ISO 8601 con zona horaria. No puede ser futuro.',
    example: '2026-10-31T08:00:00-05:00',
  })
  @IsDateTimeWithOffset()
  measuredAt: string;
}
