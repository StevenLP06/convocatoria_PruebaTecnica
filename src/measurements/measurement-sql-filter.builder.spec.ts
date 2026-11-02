import { VariableCode } from '@prisma/client';
import { andConditions, buildMeasurementSqlConditions } from './measurement-sql-filter.builder';

describe('buildMeasurementSqlConditions', () => {
  it('sin filtros no genera condiciones y andConditions devuelve TRUE', () => {
    const conditions = buildMeasurementSqlConditions({});
    expect(conditions).toHaveLength(0);
    expect(andConditions(conditions).text).toBe('TRUE');
  });

  it('genera condiciones parametrizadas (nunca concatena valores)', () => {
    const sql = andConditions(
      buildMeasurementSqlConditions({
        stationId: 3,
        variable: VariableCode.PH,
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      }),
    );

    expect(sql.text).toBe(
      'm."station_id" = $1 AND v."code"::text = $2 AND ' +
        'm."measured_at" >= $3::timestamptz AND m."measured_at" <= $4::timestamptz',
    );
    expect(sql.values).toEqual([3, 'PH', '2026-10-01T05:00:00.000Z', '2026-10-08T04:59:59.999Z']);
  });
});
