import { ApiProperty } from '@nestjs/swagger';
import { StationType } from '@prisma/client';

export class StationMunicipality {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17001' })
  daneCode: string;

  @ApiProperty({ example: 'Manizales' })
  name: string;

  @ApiProperty({ example: 'Caldas' })
  department: string;
}

export class StationResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'MZL-01' })
  code: string;

  @ApiProperty({ example: 'Manizales - Centro' })
  name: string;

  @ApiProperty({ enum: StationType, enumName: 'StationType', example: StationType.URBAN })
  type: StationType;

  @ApiProperty({ example: 5.06844 })
  latitude: number;

  @ApiProperty({ example: -75.51732 })
  longitude: number;

  @ApiProperty({ description: 'Altitud en metros sobre el nivel del mar', example: 2150 })
  altitudeM: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: () => StationMunicipality })
  municipality: StationMunicipality;
}
