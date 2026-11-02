import { type Prisma } from '@prisma/client';
import { parseDateBoundary } from '../common/utils/date-boundary.util';
import { type MeasurementFilterDto } from './dto/measurement-filter.dto';

/**
 * Traduce los filtros de la API a una condición de Prisma.
 * Ambos extremos del rango de fechas son inclusivos.
 * Función pura: se reutiliza en el listado de mediciones y en los análisis.
 */
export function buildMeasurementWhere(filter: MeasurementFilterDto): Prisma.MeasurementWhereInput {
  const where: Prisma.MeasurementWhereInput = {};

  if (filter.stationId !== undefined) {
    where.stationId = filter.stationId;
  }

  if (filter.variable !== undefined) {
    where.variable = { code: filter.variable };
  }

  if (filter.startDate !== undefined || filter.endDate !== undefined) {
    const measuredAt: { gte?: Date; lte?: Date } = {};

    if (filter.startDate !== undefined) {
      measuredAt.gte = parseDateBoundary(filter.startDate, 'start');
    }
    if (filter.endDate !== undefined) {
      measuredAt.lte = parseDateBoundary(filter.endDate, 'end');
    }

    where.measuredAt = measuredAt;
  }

  return where;
}
