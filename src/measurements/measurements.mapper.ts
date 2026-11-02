import { type Prisma } from '@prisma/client';
import { decimalToNumber } from '../common/utils/decimal.util';
import { type MeasurementResponse } from './dto/measurement-response.dto';

export const measurementInclude = {
  station: { select: { id: true, code: true, name: true } },
  variable: { select: { code: true, name: true, unit: true } },
} satisfies Prisma.MeasurementInclude;

type MeasurementWithRelations = Prisma.MeasurementGetPayload<{
  include: typeof measurementInclude;
}>;

export function toMeasurementResponse(measurement: MeasurementWithRelations): MeasurementResponse {
  return {
    id: measurement.id,
    value: decimalToNumber(measurement.value),
    measuredAt: measurement.measuredAt,
    station: measurement.station,
    variable: measurement.variable,
  };
}
