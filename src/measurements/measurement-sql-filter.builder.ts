import { Prisma } from '@prisma/client';
import { parseDateBoundary } from '../common/utils/date-boundary.util';
import { type MeasurementFilterDto } from './dto/measurement-filter.dto';

/**
 * Equivalente en SQL de `buildMeasurementWhere`, para consultas de análisis que
 * Prisma no puede expresar con su API (agregados con la fila que los originó,
 * comparación de una columna contra el umbral de otra tabla, etc.).
 *
 * Convención de alias en la consulta que lo usa:
 *   m = measurements, v = variables.
 *
 * Todos los valores van como parámetros enlazados (nunca concatenados), por lo
 * que la consulta es inmune a inyección SQL.
 */
export function buildMeasurementSqlConditions(filter: MeasurementFilterDto): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];

  if (filter.stationId !== undefined) {
    conditions.push(Prisma.sql`m."station_id" = ${filter.stationId}`);
  }

  if (filter.variable !== undefined) {
    // Se compara como texto: el parámetro llega como text y la columna es un enum.
    conditions.push(Prisma.sql`v."code"::text = ${filter.variable}`);
  }

  // Las fechas se envían como ISO 8601 en UTC y se convierten explícitamente a
  // timestamptz para que el resultado no dependa de la zona horaria de la sesión.
  if (filter.startDate !== undefined) {
    const from = parseDateBoundary(filter.startDate, 'start').toISOString();
    conditions.push(Prisma.sql`m."measured_at" >= ${from}::timestamptz`);
  }

  if (filter.endDate !== undefined) {
    const to = parseDateBoundary(filter.endDate, 'end').toISOString();
    conditions.push(Prisma.sql`m."measured_at" <= ${to}::timestamptz`);
  }

  return conditions;
}

/** Une condiciones con AND. Sin condiciones devuelve `TRUE` (no filtra nada). */
export function andConditions(conditions: Prisma.Sql[]): Prisma.Sql {
  return conditions.length > 0 ? Prisma.join(conditions, ' AND ') : Prisma.sql`TRUE`;
}
