import { NotFoundException } from '@nestjs/common';
import { VariableCode } from '@prisma/client';
import { SortOrder } from '../measurements/dto/list-measurements-query.dto';
import { type PrismaService } from '../prisma/prisma.service';
import { type AlertRow } from './analytics.queries';
import { AnalyticsService } from './analytics.service';
import { AnalyticsGroupBy } from './dto/analytics-query.dto';
import { type ListAlertsQueryDto } from './dto/list-alerts-query.dto';

function createPrismaMock() {
  return {
    $queryRaw: jest.fn(),
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    station: { findUnique: jest.fn() },
  };
}

const alertRow: AlertRow = {
  id: 1717,
  value: 9.31,
  measuredAt: new Date('2026-10-27T14:36:00Z'),
  stationId: 5,
  stationCode: 'CHN-01',
  stationName: 'Chinchiná - Rural',
  variableCode: 'PH',
  variableName: 'Calidad del agua (pH)',
  variableUnit: 'pH',
  condition: 'ABOVE_MAX',
  threshold: 9,
};

describe('AnalyticsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AnalyticsService;

  const alertsQuery: ListAlertsQueryDto = { page: 1, limit: 20, order: SortOrder.Desc };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  it('responde 404 si la estación filtrada no existe', async () => {
    prisma.station.findUnique.mockResolvedValue(null);

    await expect(
      service.getAverages({ stationId: 99, groupBy: AnalyticsGroupBy.Variable }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('devuelve los filtros aplicados con las fechas resueltas', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const result = await service.getExtremes({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      groupBy: AnalyticsGroupBy.Station,
    });

    expect(result.filters).toEqual({
      from: '2026-10-01T05:00:00.000Z',
      to: '2026-11-01T04:59:59.999Z',
      stationId: null,
      variable: null,
      groupBy: AnalyticsGroupBy.Station,
    });
  });

  it('resume las alertas e incluye en 0 las variables sin alertas', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([alertRow]).mockResolvedValueOnce([
      { variableCode: 'PM25', count: 4 },
      { variableCode: 'PH', count: 2 },
    ]);

    const result = await service.getAlerts(alertsQuery);

    expect(result.summary).toEqual({
      totalAlerts: 6,
      byVariable: { TEMPERATURE: 0, HUMIDITY: 0, PM25: 4, PRECIPITATION: 0, PH: 2 },
    });
    expect(result.meta).toEqual({ page: 1, limit: 20, totalItems: 6, totalPages: 1 });
    expect(result.data[0]).toMatchObject({
      station: { code: 'CHN-01' },
      variable: { code: 'PH' },
      condition: 'ABOVE_MAX',
      threshold: 9,
    });
  });

  it('con filtro de variable, el resumen solo incluye esa variable', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await service.getAlerts({ ...alertsQuery, variable: VariableCode.HUMIDITY });

    expect(result.summary).toEqual({ totalAlerts: 0, byVariable: { HUMIDITY: 0 } });
  });
});
