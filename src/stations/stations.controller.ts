import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BadRequestErrorDto, NotFoundErrorDto } from '../common/dto/error-response.dto';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { API_TAGS } from '../config/swagger.config';
import { ListStationsQueryDto } from './dto/list-stations-query.dto';
import { StationResponse } from './dto/station-response.dto';
import { StationsService } from './stations.service';

@ApiTags(API_TAGS.stations)
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista las estaciones',
    description: 'Filtros opcionales por municipio, tipo (URBAN/RURAL) y estado.',
  })
  @ApiOkResponse({ type: [StationResponse] })
  @ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Filtros inválidos' })
  findAll(@Query() query: ListStationsQueryDto): Promise<StationResponse[]> {
    return this.stationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una estación' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: StationResponse })
  @ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Identificador inválido' })
  @ApiNotFoundResponse({ type: NotFoundErrorDto, description: 'La estación no existe' })
  findOne(@Param('id', ParseIdPipe) id: number): Promise<StationResponse> {
    return this.stationsService.findOne(id);
  }
}
