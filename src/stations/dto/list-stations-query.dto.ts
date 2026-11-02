import { ApiPropertyOptional } from '@nestjs/swagger';
import { StationType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_INT_ID } from '../../common/constants/app.constants';
import { toBoolean, toUpperCase } from '../../common/utils/query-transform.util';

export class ListStationsQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por municipio (id)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INT_ID)
  municipalityId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por tipo de estación',
    enum: StationType,
    enumName: 'StationType',
  })
  @IsOptional()
  @Transform(toUpperCase)
  @IsEnum(StationType, { message: 'type debe ser uno de: URBAN, RURAL' })
  type?: StationType;

  @ApiPropertyOptional({ description: 'Filtra por estado de la estación', example: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;
}
