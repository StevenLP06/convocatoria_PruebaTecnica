import { VariableCode } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { MAX_INT_ID } from '../../common/constants/app.constants';
import { toUpperCase } from '../../common/utils/query-transform.util';
import { IsDateTimeWithOffset } from '../../common/validators/date.validators';

export class CreateMeasurementDto {
  /** Estación que registra la medición. */
  @IsInt()
  @Min(1)
  @Max(MAX_INT_ID)
  stationId: number;

  /** Variable medida (código). */
  @Transform(toUpperCase)
  @IsEnum(VariableCode, {
    message: `variable debe ser uno de: ${Object.values(VariableCode).join(', ')}`,
  })
  variable: VariableCode;

  /** Valor medido, en la unidad de la variable (máximo 2 decimales). */
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'value debe ser un número con máximo 2 decimales' },
  )
  value: number;

  /** Instante de la medición: ISO 8601 con zona horaria (p. ej. 2026-10-05T08:00:00-05:00). */
  @IsDateTimeWithOffset()
  measuredAt: string;
}
