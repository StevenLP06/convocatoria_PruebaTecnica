import { IsOptional } from 'class-validator';
import { IsDateFilter, IsNotBeforeDate } from '../validators/date.validators';

/**
 * Filtro por rango de fechas (ambos extremos inclusivos).
 * Acepta `YYYY-MM-DD` (día completo en hora de Colombia) o fecha-hora con zona.
 */
export class DateRangeQueryDto {
  @IsOptional()
  @IsDateFilter()
  startDate?: string;

  @IsOptional()
  @IsDateFilter()
  @IsNotBeforeDate('startDate')
  endDate?: string;
}
