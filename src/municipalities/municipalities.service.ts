import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  municipalityDetailInclude,
  municipalityListInclude,
  type MunicipalityDetailResponse,
  type MunicipalityResponse,
  toMunicipalityDetailResponse,
  toMunicipalityResponse,
} from './municipalities.mapper';

@Injectable()
export class MunicipalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MunicipalityResponse[]> {
    const municipalities = await this.prisma.municipality.findMany({
      include: municipalityListInclude,
      orderBy: { name: 'asc' },
    });

    return municipalities.map(toMunicipalityResponse);
  }

  async findOne(id: number): Promise<MunicipalityDetailResponse> {
    const municipality = await this.prisma.municipality.findUnique({
      where: { id },
      include: municipalityDetailInclude,
    });

    if (!municipality) {
      throw new NotFoundException(`No existe el municipio con id ${id}`);
    }

    return toMunicipalityDetailResponse(municipality);
  }
}
