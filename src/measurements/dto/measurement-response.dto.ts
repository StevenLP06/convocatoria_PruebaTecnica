import { ApiProperty } from '@nestjs/swagger';
import { VariableCode } from '@prisma/client';
import { PaginationMeta } from '../../common/dto/paginated-response';

export class MeasurementStation {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'MZL-01' })
  code: string;

  @ApiProperty({ example: 'Manizales - Centro' })
  name: string;
}

export class MeasurementVariable {
  @ApiProperty({ enum: VariableCode, enumName: 'VariableCode', example: VariableCode.PM25 })
  code: VariableCode;

  @ApiProperty({ example: 'Material particulado PM2.5' })
  name: string;

  @ApiProperty({ example: 'µg/m³' })
  unit: string;
}

export class MeasurementResponse {
  @ApiProperty({ example: 533 })
  id: number;

  @ApiProperty({ example: 31.4 })
  value: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Instante de la medición en UTC',
    example: '2026-10-07T12:12:00.000Z',
  })
  measuredAt: Date;

  @ApiProperty({ type: () => MeasurementStation })
  station: MeasurementStation;

  @ApiProperty({ type: () => MeasurementVariable })
  variable: MeasurementVariable;
}

export class PaginatedMeasurementsResponse {
  @ApiProperty({ type: () => [MeasurementResponse] })
  data: MeasurementResponse[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
