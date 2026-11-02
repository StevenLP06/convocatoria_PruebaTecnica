import { type Prisma, type StationType } from '@prisma/client';
import { decimalToNumber } from '../common/utils/decimal.util';

export const stationInclude = {
  municipality: { select: { id: true, daneCode: true, name: true, department: true } },
} satisfies Prisma.StationInclude;

type StationWithMunicipality = Prisma.StationGetPayload<{ include: typeof stationInclude }>;

export interface StationResponse {
  id: number;
  code: string;
  name: string;
  type: StationType;
  latitude: number;
  longitude: number;
  altitudeM: number;
  isActive: boolean;
  municipality: {
    id: number;
    daneCode: string;
    name: string;
    department: string;
  };
}

export function toStationResponse(station: StationWithMunicipality): StationResponse {
  return {
    id: station.id,
    code: station.code,
    name: station.name,
    type: station.type,
    latitude: decimalToNumber(station.latitude),
    longitude: decimalToNumber(station.longitude),
    altitudeM: station.altitudeM,
    isActive: station.isActive,
    municipality: station.municipality,
  };
}
