import { Controller, Get, Param } from '@nestjs/common';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import {
  type MunicipalityDetailResponse,
  type MunicipalityResponse,
} from './municipalities.mapper';
import { MunicipalitiesService } from './municipalities.service';

@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  /** Lista los municipios con la cantidad de estaciones de cada uno. */
  @Get()
  findAll(): Promise<MunicipalityResponse[]> {
    return this.municipalitiesService.findAll();
  }

  /** Detalle de un municipio con sus estaciones. */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number): Promise<MunicipalityDetailResponse> {
    return this.municipalitiesService.findOne(id);
  }
}
