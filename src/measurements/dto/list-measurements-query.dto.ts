import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../common/constants/app.constants';
import { toLowerCase } from '../../common/utils/query-transform.util';
import { MeasurementFilterDto } from './measurement-filter.dto';

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * Filtros + paginación + orden para el listado de mediciones.
 *
 * Extiende los filtros comunes (que también usan, sin paginación, los
 * endpoints de análisis) agregando paginación y orden.
 */
export class ListMeasurementsQueryDto extends MeasurementFilterDto {
  @ApiPropertyOptional({ description: 'Número de página (inicia en 1)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'Orden por fecha de medición: desc (más recientes primero) o asc',
    enum: SortOrder,
    enumName: 'SortOrder',
    default: SortOrder.Desc,
  })
  @IsOptional()
  @Transform(toLowerCase)
  @IsEnum(SortOrder, { message: 'order debe ser asc o desc' })
  order: SortOrder = SortOrder.Desc;
}
