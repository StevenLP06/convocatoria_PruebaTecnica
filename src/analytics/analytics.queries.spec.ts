import { SortOrder } from '../measurements/dto/list-measurements-query.dto';
import { alertsQuery, averagesQuery, extremesQuery } from './analytics.queries';
import { AnalyticsGroupBy } from './dto/analytics-query.dto';

const compact = (text: string): string => text.replace(/\s+/g, ' ');

describe('consultas de análisis', () => {
  it('agrupar por variable usa una clave de estación constante (NULL)', () => {
    const sql = compact(averagesQuery({}, AnalyticsGroupBy.Variable).text);
    expect(sql).toContain('NULL::int AS "group_station_id"');
  });

  it('agrupar por estación usa la estación de cada medición', () => {
    const sql = compact(extremesQuery({}, AnalyticsGroupBy.Station).text);
    expect(sql).toContain('PARTITION BY m."variable_id", m."station_id"');
  });

  it('las alertas aplican la regla de umbral estricta', () => {
    const sql = compact(alertsQuery({}, 1, 20, SortOrder.Desc).text);
    expect(sql).toContain('(m."value" > v."alert_max" OR m."value" < v."alert_min")');
  });

  it('la paginación y el filtro viajan como parámetros y el orden como palabra clave', () => {
    const query = alertsQuery({ stationId: 2 }, 3, 10, SortOrder.Asc);
    const sql = compact(query.text);

    expect(sql).toContain('ORDER BY m."measured_at" ASC, m."id" ASC LIMIT $2 OFFSET $3');
    expect(query.values).toEqual([2, 10, 20]);
  });
});
