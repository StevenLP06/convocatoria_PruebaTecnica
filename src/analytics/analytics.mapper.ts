import { type VariableCode } from '@prisma/client';
import { parseDateBoundary } from '../common/utils/date-boundary.util';
import { type MeasurementFilterDto } from '../measurements/dto/measurement-filter.dto';
import {
  type AlertCondition,
  type AlertRow,
  type AverageRow,
  type ExtremeRow,
} from './analytics.queries';

export interface StationRef {
  id: number;
  code: string;
  name: string;
}

export interface VariableRef {
  code: VariableCode;
  name: string;
  unit: string;
}

/** Filtros efectivamente aplicados, con las fechas ya resueltas a instantes UTC. */
export interface AppliedFilters {
  from: string | null;
  to: string | null;
  stationId: number | null;
  variable: VariableCode | null;
}

export interface AverageResult {
  variable: VariableRef;
  /** Estación del grupo; `null` cuando se agrupa solo por variable. */
  station: StationRef | null;
  average: number;
  count: number;
}

export interface ExtremeValue {
  value: number;
  measuredAt: Date;
  station: StationRef;
}

export interface ExtremeResult {
  variable: VariableRef;
  /** Estación del grupo; `null` cuando se agrupa solo por variable. */
  station: StationRef | null;
  count: number;
  max: ExtremeValue;
  min: ExtremeValue;
}

export interface AlertResult {
  id: number;
  value: number;
  measuredAt: Date;
  station: StationRef;
  variable: VariableRef;
  /** ABOVE_MAX: superó el umbral máximo. BELOW_MIN: quedó bajo el umbral mínimo. */
  condition: AlertCondition;
  /** Umbral superado. */
  threshold: number;
}

export function toAppliedFilters(filter: MeasurementFilterDto): AppliedFilters {
  return {
    from:
      filter.startDate === undefined
        ? null
        : parseDateBoundary(filter.startDate, 'start').toISOString(),
    to:
      filter.endDate === undefined ? null : parseDateBoundary(filter.endDate, 'end').toISOString(),
    stationId: filter.stationId ?? null,
    variable: filter.variable ?? null,
  };
}

function toVariableRef(row: {
  variableCode: string;
  variableName: string;
  variableUnit: string;
}): VariableRef {
  return {
    code: row.variableCode as VariableCode,
    name: row.variableName,
    unit: row.variableUnit,
  };
}

function toGroupStation(row: {
  stationId: number | null;
  stationCode: string | null;
  stationName: string | null;
}): StationRef | null {
  if (row.stationId === null || row.stationCode === null || row.stationName === null) {
    return null;
  }
  return { id: row.stationId, code: row.stationCode, name: row.stationName };
}

export function toAverageResult(row: AverageRow): AverageResult {
  return {
    variable: toVariableRef(row),
    station: toGroupStation(row),
    average: row.average,
    count: row.count,
  };
}

export function toExtremeResult(row: ExtremeRow): ExtremeResult {
  return {
    variable: toVariableRef(row),
    station: toGroupStation(row),
    count: row.count,
    max: {
      value: row.maxValue,
      measuredAt: row.maxMeasuredAt,
      station: { id: row.maxStationId, code: row.maxStationCode, name: row.maxStationName },
    },
    min: {
      value: row.minValue,
      measuredAt: row.minMeasuredAt,
      station: { id: row.minStationId, code: row.minStationCode, name: row.minStationName },
    },
  };
}

export function toAlertResult(row: AlertRow): AlertResult {
  return {
    id: row.id,
    value: row.value,
    measuredAt: row.measuredAt,
    station: { id: row.stationId, code: row.stationCode, name: row.stationName },
    variable: toVariableRef(row),
    condition: row.condition,
    threshold: row.threshold,
  };
}
