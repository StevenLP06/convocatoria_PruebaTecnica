import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, VariableCode } from '@prisma/client';
import { type PrismaService } from '../prisma/prisma.service';
import { type CreateMeasurementDto } from './dto/create-measurement.dto';
import { type ListMeasurementsQueryDto, SortOrder } from './dto/list-measurements-query.dto';
import { MeasurementsService } from './measurements.service';

const station = { id: 1, code: 'MZL-01', name: 'Manizales - Centro', isActive: true };
const variable = { id: 4, code: VariableCode.PRECIPITATION, name: 'Precipitación', unit: 'mm' };

function storedMeasurement(id: number, value: string, measuredAt: string) {
  return {
    id,
    stationId: station.id,
    variableId: variable.id,
    value: new Prisma.Decimal(value),
    measuredAt: new Date(measuredAt),
    createdAt: new Date(),
    station: { id: station.id, code: station.code, name: station.name },
    variable: { code: variable.code, name: variable.name, unit: variable.unit },
  };
}

function createPrismaMock() {
  return {
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    measurement: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    station: { findUnique: jest.fn() },
    variable: { findUnique: jest.fn() },
  };
}

describe('MeasurementsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: MeasurementsService;

  const validDto: CreateMeasurementDto = {
    stationId: 1,
    variable: VariableCode.PRECIPITATION,
    value: 12.5,
    measuredAt: '2026-10-05T08:00:00-05:00',
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new MeasurementsService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('devuelve la página solicitada con metadatos y valores numéricos', async () => {
      prisma.measurement.count.mockResolvedValue(45);
      prisma.measurement.findMany.mockResolvedValue([
        storedMeasurement(10, '3.40', '2026-10-05T13:00:00Z'),
      ]);

      const query: ListMeasurementsQueryDto = {
        stationId: 1,
        page: 3,
        limit: 20,
        order: SortOrder.Asc,
      };
      const result = await service.findAll(query);

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stationId: 1 },
          orderBy: [{ measuredAt: 'asc' }, { id: 'asc' }],
          skip: 40,
          take: 20,
        }),
      );
      expect(result.meta).toEqual({ page: 3, limit: 20, totalItems: 45, totalPages: 3 });
      expect(result.data[0].value).toBe(3.4);
    });
  });

  describe('findOne', () => {
    it('lanza 404 si la medición no existe', async () => {
      prisma.measurement.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('registra una medición válida', async () => {
      prisma.station.findUnique.mockResolvedValue(station);
      prisma.variable.findUnique.mockResolvedValue(variable);
      prisma.measurement.create.mockResolvedValue(
        storedMeasurement(2501, '12.50', '2026-10-05T13:00:00Z'),
      );

      const result = await service.create(validDto);

      expect(prisma.measurement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            stationId: 1,
            variableId: 4,
            value: 12.5,
            measuredAt: new Date('2026-10-05T13:00:00.000Z'),
          },
        }),
      );
      expect(result).toMatchObject({ id: 2501, value: 12.5, station: { code: 'MZL-01' } });
    });

    it('rechaza fechas futuras', async () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await expect(service.create({ ...validDto, measuredAt: future })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.measurement.create).not.toHaveBeenCalled();
    });

    it('rechaza valores físicamente imposibles', async () => {
      await expect(
        service.create({ ...validDto, variable: VariableCode.HUMIDITY, value: 140 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 404 si la estación no existe', async () => {
      prisma.station.findUnique.mockResolvedValue(null);
      prisma.variable.findUnique.mockResolvedValue(variable);
      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('lanza 422 si la estación está inactiva', async () => {
      prisma.station.findUnique.mockResolvedValue({ ...station, isActive: false });
      prisma.variable.findUnique.mockResolvedValue(variable);
      await expect(service.create(validDto)).rejects.toThrow(UnprocessableEntityException);
    });

    it('lanza 409 si ya existe una medición en ese instante', async () => {
      prisma.station.findUnique.mockResolvedValue(station);
      prisma.variable.findUnique.mockResolvedValue(variable);
      prisma.measurement.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
    });
  });
});
