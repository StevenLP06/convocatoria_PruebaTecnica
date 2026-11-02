import { VariableCode } from '@prisma/client';
import { buildMeasurementWhere } from './measurement-where.builder';

describe('buildMeasurementWhere', () => {
  it('sin filtros devuelve una condición vacía', () => {
    expect(buildMeasurementWhere({})).toEqual({});
  });

  it('combina estación, variable y rango de fechas', () => {
    expect(
      buildMeasurementWhere({
        stationId: 3,
        variable: VariableCode.PM25,
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      }),
    ).toEqual({
      stationId: 3,
      variable: { code: VariableCode.PM25 },
      measuredAt: {
        gte: new Date('2026-10-01T05:00:00.000Z'),
        lte: new Date('2026-10-08T04:59:59.999Z'),
      },
    });
  });

  it('admite un rango abierto por un solo extremo', () => {
    expect(buildMeasurementWhere({ endDate: '2026-10-05T12:00:00-05:00' })).toEqual({
      measuredAt: { lte: new Date('2026-10-05T17:00:00.000Z') },
    });
  });
});
