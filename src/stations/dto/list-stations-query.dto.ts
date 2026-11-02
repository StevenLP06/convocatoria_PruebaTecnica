import { StationType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_INT_ID } from '../../common/constants/app.constants';
import { toBoolean, toUpperCase } from '../../common/utils/query-transform.util';

export class ListStationsQueryDto {
  /** Filtra por municipio. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INT_ID)
  municipalityId?: number;

  /** Filtra por tipo de estación (URBAN o RURAL). */
  @IsOptional()
  @Transform(toUpperCase)
  @IsEnum(StationType, { message: 'type debe ser uno de: URBAN, RURAL' })
  type?: StationType;

  /** Filtra por estado de la estación. */
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;
}
