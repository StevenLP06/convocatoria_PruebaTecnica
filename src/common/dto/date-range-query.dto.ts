import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsDateFilter, IsNotBeforeDate } from '../validators/date.validators';

const DATE_FORMAT_HELP =
  'YYYY-MM-DD (día completo en hora de Colombia) o fecha-hora ISO 8601 con zona horaria.';

/**
 * Filtro por rango de fechas (ambos extremos inclusivos).
 * Acepta `YYYY-MM-DD` (día completo en hora de Colombia) o fecha-hora con zona.
 */
export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: `Fecha inicial (inclusiva). ${DATE_FORMAT_HELP}`,
    example: '2026-10-01',
  })
  @IsOptional()
  @IsDateFilter()
  startDate?: string;

  @ApiPropertyOptional({
    description: `Fecha final (inclusiva). ${DATE_FORMAT_HELP}`,
    example: '2026-10-07',
  })
  @IsOptional()
  @IsDateFilter()
  @IsNotBeforeDate('startDate')
  endDate?: string;
}
