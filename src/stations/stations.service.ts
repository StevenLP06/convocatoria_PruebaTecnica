import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type ListStationsQueryDto } from './dto/list-stations-query.dto';
import { stationInclude, type StationResponse, toStationResponse } from './stations.mapper';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListStationsQueryDto): Promise<StationResponse[]> {
    const where: Prisma.StationWhereInput = {};

    if (query.municipalityId !== undefined) {
      where.municipalityId = query.municipalityId;
    }
    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const stations = await this.prisma.station.findMany({
      where,
      include: stationInclude,
      orderBy: { code: 'asc' },
    });

    return stations.map(toStationResponse);
  }

  async findOne(id: number): Promise<StationResponse> {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: stationInclude,
    });

    if (!station) {
      throw new NotFoundException(`No existe la estación con id ${id}`);
    }

    return toStationResponse(station);
  }
}
