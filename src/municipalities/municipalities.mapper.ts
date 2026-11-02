import { type Prisma, type StationType } from '@prisma/client';

export const municipalityListInclude = {
  _count: { select: { stations: true } },
} satisfies Prisma.MunicipalityInclude;

export const municipalityDetailInclude = {
  stations: {
    select: { id: true, code: true, name: true, type: true, isActive: true },
    orderBy: { code: 'asc' },
  },
} satisfies Prisma.MunicipalityInclude;

type MunicipalityWithCount = Prisma.MunicipalityGetPayload<{
  include: typeof municipalityListInclude;
}>;
type MunicipalityWithStations = Prisma.MunicipalityGetPayload<{
  include: typeof municipalityDetailInclude;
}>;

export interface MunicipalityResponse {
  id: number;
  daneCode: string;
  name: string;
  department: string;
  stationsCount: number;
}

export interface MunicipalityStationSummary {
  id: number;
  code: string;
  name: string;
  type: StationType;
  isActive: boolean;
}

export interface MunicipalityDetailResponse extends Omit<MunicipalityResponse, 'stationsCount'> {
  stations: MunicipalityStationSummary[];
}

export function toMunicipalityResponse(municipality: MunicipalityWithCount): MunicipalityResponse {
  return {
    id: municipality.id,
    daneCode: municipality.daneCode,
    name: municipality.name,
    department: municipality.department,
    stationsCount: municipality._count.stations,
  };
}

export function toMunicipalityDetailResponse(
  municipality: MunicipalityWithStations,
): MunicipalityDetailResponse {
  return {
    id: municipality.id,
    daneCode: municipality.daneCode,
    name: municipality.name,
    department: municipality.department,
    stations: municipality.stations,
  };
}
