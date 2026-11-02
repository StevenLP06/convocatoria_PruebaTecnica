import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status: 'ok';

  @ApiProperty({ enum: ['up'], description: 'Estado de la conexión a PostgreSQL', example: 'up' })
  database: 'up';

  @ApiProperty({ description: 'Segundos desde que arrancó el proceso', example: 128 })
  uptimeSeconds: number;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-11-02T06:30:00.000Z' })
  timestamp: string;
}
