import { ApiPropertyOptional } from '@nestjs/swagger';
import { VariableCode } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_INT_ID } from '../../common/constants/app.constants';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { toUpperCase } from '../../common/utils/query-transform.util';

/**
 * Filtros comunes sobre mediciones: rango de fechas, estación y variable.
 * Se reutiliza en el listado de mediciones y en los endpoints de análisis.
 */
export class MeasurementFilterDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por estación (id)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INT_ID)
  stationId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por variable ambiental (no distingue mayúsculas)',
    enum: VariableCode,
    enumName: 'VariableCode',
  })
  @IsOptional()
  @Transform(toUpperCase)
  @IsEnum(VariableCode, {
    message: `variable debe ser uno de: ${Object.values(VariableCode).join(', ')}`,
  })
  variable?: VariableCode;
}
