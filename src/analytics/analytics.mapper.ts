import { type VariableCode } from '@prisma/client';
import { parseDateBoundary } from '../common/utils/date-boundary.util';
import { type MeasurementFilterDto } from '../measurements/dto/measurement-filter.dto';
import { type AlertRow, type AverageRow, type ExtremeRow } from './analytics.queries';
import {
  type AlertResult,
  type AppliedFilters,
  type AverageResult,
  type ExtremeResult,
  type StationRef,
  type VariableRef,
} from './dto/analytics-response.dto';

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
