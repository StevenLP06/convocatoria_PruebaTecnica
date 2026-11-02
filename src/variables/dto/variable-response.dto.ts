import { ApiProperty } from '@nestjs/swagger';
import { VariableCode } from '@prisma/client';

export class AlertThresholds {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Alerta si el valor es estrictamente menor. null = sin límite inferior',
    example: null,
  })
  min: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Alerta si el valor es estrictamente mayor. null = sin límite superior',
    example: 35,
  })
  max: number | null;
}

export class VariableResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: VariableCode, enumName: 'VariableCode', example: VariableCode.TEMPERATURE })
  code: VariableCode;

  @ApiProperty({ example: 'Temperatura ambiental' })
  name: string;

  @ApiProperty({ example: '°C' })
  unit: string;

  @ApiProperty({ type: () => AlertThresholds })
  alertThresholds: AlertThresholds;
}
