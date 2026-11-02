import { Controller, Get, Param, Query } from '@nestjs/common';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { ListStationsQueryDto } from './dto/list-stations-query.dto';
import { type StationResponse } from './stations.mapper';
import { StationsService } from './stations.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  /** Lista las estaciones, con filtros opcionales por municipio, tipo y estado. */
  @Get()
  findAll(@Query() query: ListStationsQueryDto): Promise<StationResponse[]> {
    return this.stationsService.findAll(query);
  }

  /** Detalle de una estación. */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number): Promise<StationResponse> {
    return this.stationsService.findOne(id);
  }
}
