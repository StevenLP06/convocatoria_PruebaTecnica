import { Controller, Get, Param } from '@nestjs/common';
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
import { MunicipalityDetailResponse, MunicipalityResponse } from './dto/municipality-response.dto';
import { MunicipalitiesService } from './municipalities.service';

@ApiTags(API_TAGS.municipalities)
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los municipios con la cantidad de estaciones de cada uno' })
  @ApiOkResponse({ type: [MunicipalityResponse] })
  findAll(): Promise<MunicipalityResponse[]> {
    return this.municipalitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un municipio con sus estaciones' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: MunicipalityDetailResponse })
  @ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Identificador inválido' })
  @ApiNotFoundResponse({ type: NotFoundErrorDto, description: 'El municipio no existe' })
  findOne(@Param('id', ParseIdPipe) id: number): Promise<MunicipalityDetailResponse> {
    return this.municipalitiesService.findOne(id);
  }
}
