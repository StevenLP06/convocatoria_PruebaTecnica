import { type Prisma, type VariableCode } from '@prisma/client';
import { decimalToNumber } from '../common/utils/decimal.util';

export const measurementInclude = {
  station: { select: { id: true, code: true, name: true } },
  variable: { select: { code: true, name: true, unit: true } },
} satisfies Prisma.MeasurementInclude;

type MeasurementWithRelations = Prisma.MeasurementGetPayload<{
  include: typeof measurementInclude;
}>;

export interface MeasurementResponse {
  id: number;
  value: number;
  /** Instante de la medición en UTC (ISO 8601). */
  measuredAt: Date;
  station: {
    id: number;
    code: string;
    name: string;
  };
  variable: {
    code: VariableCode;
    name: string;
    unit: string;
  };
}

export function toMeasurementResponse(measurement: MeasurementWithRelations): MeasurementResponse {
  return {
    id: measurement.id,
    value: decimalToNumber(measurement.value),
    measuredAt: measurement.measuredAt,
    station: measurement.station,
    variable: measurement.variable,
  };
}
