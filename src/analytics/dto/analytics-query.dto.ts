import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { toLowerCase } from '../../common/utils/query-transform.util';
import { MeasurementFilterDto } from '../../measurements/dto/measurement-filter.dto';

export enum AnalyticsGroupBy {
  /** Un resultado por variable, combinando las estaciones filtradas. */
  Variable = 'variable',
  /** Un resultado por cada combinación de estación y variable. */
  Station = 'station',
}

/**
 * Filtros de los endpoints de promedios y extremos:
 * rango de fechas, estación, variable y nivel de agrupación.
 */
export class AnalyticsQueryDto extends MeasurementFilterDto {
  @ApiPropertyOptional({
    description:
      'variable: un resultado por variable (combina las estaciones filtradas). ' +
      'station: un resultado por cada estación y variable.',
    enum: AnalyticsGroupBy,
    enumName: 'AnalyticsGroupBy',
    default: AnalyticsGroupBy.Variable,
  })
  @IsOptional()
  @Transform(toLowerCase)
  @IsEnum(AnalyticsGroupBy, { message: 'groupBy debe ser variable o station' })
  groupBy: AnalyticsGroupBy = AnalyticsGroupBy.Variable;
}
