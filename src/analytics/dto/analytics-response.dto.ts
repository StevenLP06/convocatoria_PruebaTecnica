import { ApiProperty } from '@nestjs/swagger';
import { VariableCode } from '@prisma/client';
import { PaginationMeta } from '../../common/dto/paginated-response';
import { type AlertCondition } from '../analytics.queries';
import { AnalyticsGroupBy } from './analytics-query.dto';

const DATE_TIME = { type: String, format: 'date-time' } as const;

export class StationRef {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'CHN-01' })
  code: string;

  @ApiProperty({ example: 'Chinchiná - Rural' })
  name: string;
}

export class VariableRef {
  @ApiProperty({ enum: VariableCode, enumName: 'VariableCode', example: VariableCode.TEMPERATURE })
  code: VariableCode;

  @ApiProperty({ example: 'Temperatura ambiental' })
  name: string;

  @ApiProperty({ example: '°C' })
  unit: string;
}

/** Filtros efectivamente aplicados, con las fechas ya resueltas a instantes UTC. */
export class AppliedFilters {
  @ApiProperty({ ...DATE_TIME, nullable: true, example: '2026-10-01T05:00:00.000Z' })
  from: string | null;

  @ApiProperty({ ...DATE_TIME, nullable: true, example: '2026-10-08T04:59:59.999Z' })
  to: string | null;

  @ApiProperty({ type: Number, nullable: true, example: null })
  stationId: number | null;

  @ApiProperty({ enum: VariableCode, enumName: 'VariableCode', nullable: true, example: null })
  variable: VariableCode | null;
}

export class AggregationFilters extends AppliedFilters {
  @ApiProperty({ enum: AnalyticsGroupBy, enumName: 'AnalyticsGroupBy' })
  groupBy: AnalyticsGroupBy;
}

// ---------------------------------------------------------------------------
// Promedios
// ---------------------------------------------------------------------------

export class AverageResult {
  @ApiProperty({ type: () => VariableRef })
  variable: VariableRef;

  @ApiProperty({
    type: () => StationRef,
    nullable: true,
    description: 'Estación del grupo; null cuando se agrupa solo por variable',
    // Coherente con el ejemplo de filtros (groupBy=variable).
    example: null,
  })
  station: StationRef | null;

  @ApiProperty({ description: 'Promedio redondeado a 2 decimales', example: 16.58 })
  average: number;

  @ApiProperty({ description: 'Mediciones incluidas en el promedio', example: 500 })
  count: number;
}

export class AveragesResponse {
  @ApiProperty({ type: () => AggregationFilters })
  filters: AggregationFilters;

  @ApiProperty({ type: () => [AverageResult] })
  data: AverageResult[];
}

// ---------------------------------------------------------------------------
// Máximos y mínimos
// ---------------------------------------------------------------------------

export class ExtremeValue {
  @ApiProperty({ example: 36.2 })
  value: number;

  @ApiProperty({ ...DATE_TIME, example: '2026-10-14T17:00:00.000Z' })
  measuredAt: Date;

  @ApiProperty({ type: () => StationRef, description: 'Estación que registró el valor' })
  station: StationRef;
}

export class ExtremeResult {
  @ApiProperty({ type: () => VariableRef })
  variable: VariableRef;

  @ApiProperty({
    type: () => StationRef,
    nullable: true,
    description: 'Estación del grupo; null cuando se agrupa solo por variable',
    // Coherente con el ejemplo de filtros (groupBy=variable).
    example: null,
  })
  station: StationRef | null;

  @ApiProperty({ description: 'Mediciones evaluadas', example: 500 })
  count: number;

  @ApiProperty({
    type: () => ExtremeValue,
    description: 'Valor máximo (si se repite, su primera ocurrencia)',
  })
  max: ExtremeValue;

  @ApiProperty({
    type: () => ExtremeValue,
    description: 'Valor mínimo (si se repite, su primera ocurrencia)',
  })
  min: ExtremeValue;
}

export class ExtremesResponse {
  @ApiProperty({ type: () => AggregationFilters })
  filters: AggregationFilters;

  @ApiProperty({ type: () => [ExtremeResult] })
  data: ExtremeResult[];
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

export class AlertResult {
  @ApiProperty({ example: 2205 })
  id: number;

  @ApiProperty({ example: 9.31 })
  value: number;

  @ApiProperty({ ...DATE_TIME, example: '2026-10-27T14:36:00.000Z' })
  measuredAt: Date;

  @ApiProperty({ type: () => StationRef })
  station: StationRef;

  @ApiProperty({ type: () => VariableRef })
  variable: VariableRef;

  @ApiProperty({
    enum: ['ABOVE_MAX', 'BELOW_MIN'],
    description: 'ABOVE_MAX: superó el umbral máximo. BELOW_MIN: quedó bajo el umbral mínimo',
    example: 'ABOVE_MAX',
  })
  condition: AlertCondition;

  @ApiProperty({ description: 'Umbral superado', example: 9 })
  threshold: number;
}

export class AlertsSummary {
  @ApiProperty({ description: 'Total de alertas que cumplen los filtros', example: 14 })
  totalAlerts: number;

  @ApiProperty({
    description: 'Alertas por variable (incluye en 0 las variables sin alertas)',
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: { TEMPERATURE: 2, HUMIDITY: 3, PM25: 4, PRECIPITATION: 3, PH: 2 },
  })
  byVariable: Partial<Record<VariableCode, number>>;
}

export class AlertsResponse {
  @ApiProperty({ type: () => AppliedFilters })
  filters: AppliedFilters;

  @ApiProperty({ type: () => AlertsSummary })
  summary: AlertsSummary;

  @ApiProperty({ type: () => [AlertResult] })
  data: AlertResult[];

  @ApiProperty({ type: () => PaginationMeta })
  meta: PaginationMeta;
}
