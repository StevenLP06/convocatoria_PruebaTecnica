import { ApiProperty, OmitType } from '@nestjs/swagger';
import { StationType } from '@prisma/client';

export class MunicipalityResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ description: 'Código DANE del municipio', example: '17001' })
  daneCode: string;

  @ApiProperty({ example: 'Manizales' })
  name: string;

  @ApiProperty({ example: 'Caldas' })
  department: string;

  @ApiProperty({ description: 'Cantidad de estaciones del municipio', example: 3 })
  stationsCount: number;
}

export class MunicipalityStationSummary {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'MZL-01' })
  code: string;

  @ApiProperty({ example: 'Manizales - Centro' })
  name: string;

  @ApiProperty({ enum: StationType, enumName: 'StationType', example: StationType.URBAN })
  type: StationType;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class MunicipalityDetailResponse extends OmitType(MunicipalityResponse, [
  'stationsCount',
] as const) {
  @ApiProperty({ type: () => [MunicipalityStationSummary] })
  stations: MunicipalityStationSummary[];
}
