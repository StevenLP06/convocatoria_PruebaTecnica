import { type Prisma } from '@prisma/client';
import { decimalToNumber } from '../common/utils/decimal.util';
import { type StationResponse } from './dto/station-response.dto';

export const stationInclude = {
  municipality: { select: { id: true, daneCode: true, name: true, department: true } },
} satisfies Prisma.StationInclude;

type StationWithMunicipality = Prisma.StationGetPayload<{ include: typeof stationInclude }>;

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
