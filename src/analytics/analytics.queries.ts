import { Prisma } from '@prisma/client';
import { paginationOffset } from '../common/dto/paginated-response';
import { SortOrder } from '../measurements/dto/list-measurements-query.dto';
import { type MeasurementFilterDto } from '../measurements/dto/measurement-filter.dto';
import {
  andConditions,
  buildMeasurementSqlConditions,
} from '../measurements/measurement-sql-filter.builder';
import { AnalyticsGroupBy } from './dto/analytics-query.dto';

/**
 * Consultas SQL de análisis. Se escriben en SQL (con parámetros enlazados) porque
 * requieren capacidades que la API de Prisma no expone:
 *   - devolver la fila que originó un máximo o mínimo (funciones de ventana);
 *   - comparar el valor de una medición con el umbral de su variable (otra tabla).
 *
 * Alias usados en todas las consultas: m = measurements, v = variables,
 * s / gs = stations.
 */

/**
 * Regla de alerta: estrictamente mayor que el máximo o menor que el mínimo.
 * Un umbral NULL nunca alerta (la comparación con NULL no es verdadera).
 */
export const ALERT_CONDITION = Prisma.sql`(m."value" > v."alert_max" OR m."value" < v."alert_min")`;

/**
 * Clave de agrupación por estación: la estación de la medición o NULL cuando se
 * agrupa solo por variable (todas las filas caen en el mismo grupo).
 */
function groupStationKey(groupBy: AnalyticsGroupBy): Prisma.Sql {
  return groupBy === AnalyticsGroupBy.Station ? Prisma.sql`m."station_id"` : Prisma.sql`NULL::int`;
}

// ---------------------------------------------------------------------------
// Promedios
// ---------------------------------------------------------------------------

export interface AverageRow {
  variableCode: string;
  variableName: string;
  variableUnit: string;
  stationId: number | null;
  stationCode: string | null;
  stationName: string | null;
  average: number;
  count: number;
}

export function averagesQuery(filter: MeasurementFilterDto, groupBy: AnalyticsGroupBy): Prisma.Sql {
  const where = andConditions(buildMeasurementSqlConditions(filter));

  return Prisma.sql`
    SELECT
      v."code"::text                 AS "variableCode",
      v."name"                       AS "variableName",
      v."unit"                       AS "variableUnit",
      gs."id"                        AS "stationId",
      gs."code"                      AS "stationCode",
      gs."name"                      AS "stationName",
      round(avg(g."value"), 2)::float8 AS "average",
      count(*)::int                  AS "count"
    FROM (
      SELECT m."value", m."variable_id", ${groupStationKey(groupBy)} AS "group_station_id"
      FROM "measurements" m
      JOIN "variables" v ON v."id" = m."variable_id"
      WHERE ${where}
    ) g
    JOIN "variables" v ON v."id" = g."variable_id"
    LEFT JOIN "stations" gs ON gs."id" = g."group_station_id"
    GROUP BY v."id", gs."id"
    ORDER BY v."id", gs."code"
  `;
}

// ---------------------------------------------------------------------------
// Máximos y mínimos
// ---------------------------------------------------------------------------

export interface ExtremeRow {
  variableCode: string;
  variableName: string;
  variableUnit: string;
  stationId: number | null;
  stationCode: string | null;
  stationName: string | null;
  count: number;
  maxValue: number;
  maxMeasuredAt: Date;
  maxStationId: number;
  maxStationCode: string;
  maxStationName: string;
  minValue: number;
  minMeasuredAt: Date;
  minStationId: number;
  minStationCode: string;
  minStationName: string;
}

/**
 * Máximo y mínimo de cada grupo junto con la medición que los registró.
 * Si un valor extremo se repite, se reporta su primera ocurrencia.
 */
export function extremesQuery(filter: MeasurementFilterDto, groupBy: AnalyticsGroupBy): Prisma.Sql {
  const where = andConditions(buildMeasurementSqlConditions(filter));
  const groupKey = groupStationKey(groupBy);

  return Prisma.sql`
    WITH ranked AS (
      SELECT
        m."value",
        m."measured_at",
        m."station_id",
        m."variable_id",
        ${groupKey} AS "group_station_id",
        row_number() OVER (
          PARTITION BY m."variable_id", ${groupKey}
          ORDER BY m."value" DESC, m."measured_at" ASC, m."id" ASC
        ) AS "max_rank",
        row_number() OVER (
          PARTITION BY m."variable_id", ${groupKey}
          ORDER BY m."value" ASC, m."measured_at" ASC, m."id" ASC
        ) AS "min_rank",
        count(*) OVER (PARTITION BY m."variable_id", ${groupKey}) AS "group_count"
      FROM "measurements" m
      JOIN "variables" v ON v."id" = m."variable_id"
      WHERE ${where}
    )
    SELECT
      v."code"::text           AS "variableCode",
      v."name"                 AS "variableName",
      v."unit"                 AS "variableUnit",
      gs."id"                  AS "stationId",
      gs."code"                AS "stationCode",
      gs."name"                AS "stationName",
      mx."group_count"::int    AS "count",
      mx."value"::float8       AS "maxValue",
      mx."measured_at"         AS "maxMeasuredAt",
      smx."id"                 AS "maxStationId",
      smx."code"               AS "maxStationCode",
      smx."name"               AS "maxStationName",
      mn."value"::float8       AS "minValue",
      mn."measured_at"         AS "minMeasuredAt",
      smn."id"                 AS "minStationId",
      smn."code"               AS "minStationCode",
      smn."name"               AS "minStationName"
    FROM ranked mx
    JOIN ranked mn
      ON mn."variable_id" = mx."variable_id"
     AND mn."group_station_id" IS NOT DISTINCT FROM mx."group_station_id"
     AND mn."min_rank" = 1
    JOIN "variables" v    ON v."id" = mx."variable_id"
    JOIN "stations" smx   ON smx."id" = mx."station_id"
    JOIN "stations" smn   ON smn."id" = mn."station_id"
    LEFT JOIN "stations" gs ON gs."id" = mx."group_station_id"
    WHERE mx."max_rank" = 1
    ORDER BY v."id", gs."code"
  `;
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

export type AlertCondition = 'ABOVE_MAX' | 'BELOW_MIN';

export interface AlertRow {
  id: number;
  value: number;
  measuredAt: Date;
  stationId: number;
  stationCode: string;
  stationName: string;
  variableCode: string;
  variableName: string;
  variableUnit: string;
  condition: AlertCondition;
  threshold: number;
}

export interface AlertCountRow {
  variableCode: string;
  count: number;
}

/** Página de mediciones que superan su umbral, con el umbral superado. */
export function alertsQuery(
  filter: MeasurementFilterDto,
  page: number,
  limit: number,
  order: SortOrder,
): Prisma.Sql {
  const where = andConditions(buildMeasurementSqlConditions(filter));
  // La dirección no puede ser un parámetro enlazado: se elige de una lista cerrada.
  const direction = order === SortOrder.Asc ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  return Prisma.sql`
    SELECT
      m."id"                   AS "id",
      m."value"::float8        AS "value",
      m."measured_at"          AS "measuredAt",
      s."id"                   AS "stationId",
      s."code"                 AS "stationCode",
      s."name"                 AS "stationName",
      v."code"::text           AS "variableCode",
      v."name"                 AS "variableName",
      v."unit"                 AS "variableUnit",
      CASE WHEN m."value" > v."alert_max" THEN 'ABOVE_MAX' ELSE 'BELOW_MIN' END AS "condition",
      (CASE WHEN m."value" > v."alert_max" THEN v."alert_max" ELSE v."alert_min" END)::float8
                               AS "threshold"
    FROM "measurements" m
    JOIN "variables" v ON v."id" = m."variable_id"
    JOIN "stations" s  ON s."id" = m."station_id"
    WHERE ${where} AND ${ALERT_CONDITION}
    ORDER BY m."measured_at" ${direction}, m."id" ${direction}
    LIMIT ${limit} OFFSET ${paginationOffset(page, limit)}
  `;
}

/** Cantidad de alertas por variable (solo variables con al menos una alerta). */
export function alertCountsQuery(filter: MeasurementFilterDto): Prisma.Sql {
  const where = andConditions(buildMeasurementSqlConditions(filter));

  return Prisma.sql`
    SELECT v."code"::text AS "variableCode", count(*)::int AS "count"
    FROM "measurements" m
    JOIN "variables" v ON v."id" = m."variable_id"
    WHERE ${where} AND ${ALERT_CONDITION}
    GROUP BY v."id"
    ORDER BY v."id"
  `;
}
