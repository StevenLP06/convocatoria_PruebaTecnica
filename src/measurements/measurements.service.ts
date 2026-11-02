import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildPaginationMeta,
  type PaginatedResponse,
  paginationOffset,
} from '../common/dto/paginated-response';
import { PrismaService } from '../prisma/prisma.service';
import { isWithinPhysicalLimits, PHYSICAL_LIMITS } from '../variables/variable-limits';
import { type CreateMeasurementDto } from './dto/create-measurement.dto';
import { type ListMeasurementsQueryDto } from './dto/list-measurements-query.dto';
import { buildMeasurementWhere } from './measurement-where.builder';
import {
  measurementInclude,
  type MeasurementResponse,
  toMeasurementResponse,
} from './measurements.mapper';

/** Tolerancia para desfases de reloj entre la estación y el servidor. */
export const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

@Injectable()
export class MeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListMeasurementsQueryDto): Promise<PaginatedResponse<MeasurementResponse>> {
    const where = buildMeasurementWhere(query);

    // Conteo y página en la misma transacción para que sean consistentes entre sí.
    const [totalItems, measurements] = await this.prisma.$transaction([
      this.prisma.measurement.count({ where }),
      this.prisma.measurement.findMany({
        where,
        include: measurementInclude,
        // El id desempata mediciones del mismo instante: orden estable entre páginas.
        orderBy: [{ measuredAt: query.order }, { id: query.order }],
        skip: paginationOffset(query.page, query.limit),
        take: query.limit,
      }),
    ]);

    return {
      data: measurements.map(toMeasurementResponse),
      meta: buildPaginationMeta(query.page, query.limit, totalItems),
    };
  }

  async findOne(id: number): Promise<MeasurementResponse> {
    const measurement = await this.prisma.measurement.findUnique({
      where: { id },
      include: measurementInclude,
    });

    if (!measurement) {
      throw new NotFoundException(`No existe la medición con id ${id}`);
    }

    return toMeasurementResponse(measurement);
  }

  async create(dto: CreateMeasurementDto): Promise<MeasurementResponse> {
    const measuredAt = new Date(dto.measuredAt);
    this.assertNotInFuture(measuredAt);
    this.assertPhysicallyPossible(dto);

    const [station, variable] = await Promise.all([
      this.prisma.station.findUnique({ where: { id: dto.stationId } }),
      this.prisma.variable.findUnique({ where: { code: dto.variable } }),
    ]);

    if (!station) {
      throw new NotFoundException(`No existe la estación con id ${dto.stationId}`);
    }
    if (!station.isActive) {
      throw new UnprocessableEntityException(
        `La estación ${station.code} está inactiva y no puede registrar mediciones`,
      );
    }
    if (!variable) {
      throw new NotFoundException(`No existe la variable ${dto.variable}`);
    }

    try {
      const measurement = await this.prisma.measurement.create({
        data: {
          stationId: station.id,
          variableId: variable.id,
          value: dto.value,
          measuredAt,
        },
        include: measurementInclude,
      });

      return toMeasurementResponse(measurement);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `La estación ${station.code} ya registró ${variable.code} en ${measuredAt.toISOString()}`,
        );
      }
      throw error;
    }
  }

  private assertNotInFuture(measuredAt: Date): void {
    if (measuredAt.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
      throw new BadRequestException('measuredAt no puede ser una fecha futura');
    }
  }

  private assertPhysicallyPossible(dto: CreateMeasurementDto): void {
    if (!isWithinPhysicalLimits(dto.variable, dto.value)) {
      const { min, max } = PHYSICAL_LIMITS[dto.variable];
      throw new BadRequestException(
        `El valor ${dto.value} no es físicamente posible para ${dto.variable} (rango permitido: ${min} a ${max})`,
      );
    }
  }
}
