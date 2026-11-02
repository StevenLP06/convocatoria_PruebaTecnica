import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ConflictErrorDto,
  NotFoundErrorDto,
  UnprocessableEntityErrorDto,
} from '../common/dto/error-response.dto';
import { type PaginatedResponse } from '../common/dto/paginated-response';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { API_TAGS } from '../config/swagger.config';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { ListMeasurementsQueryDto } from './dto/list-measurements-query.dto';
import {
  MeasurementResponse,
  PaginatedMeasurementsResponse,
} from './dto/measurement-response.dto';
import { MeasurementsService } from './measurements.service';

@ApiTags(API_TAGS.measurements)
@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista paginada de mediciones',
    description:
      'Filtros por rango de fechas, estación y variable; paginación y orden por fecha.',
  })
  @ApiOkResponse({ type: PaginatedMeasurementsResponse })
  @ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Filtros inválidos' })
  findAll(
    @Query() query: ListMeasurementsQueryDto,
  ): Promise<PaginatedResponse<MeasurementResponse>> {
    return this.measurementsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una medición' })
  @ApiParam({ name: 'id', type: Number, example: 533 })
  @ApiOkResponse({ type: MeasurementResponse })
  @ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Identificador inválido' })
  @ApiNotFoundResponse({ type: NotFoundErrorDto, description: 'La medición no existe' })
  findOne(@Param('id', ParseIdPipe) id: number): Promise<MeasurementResponse> {
    return this.measurementsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Registra una medición',
    description:
      'Valida que la estación exista y esté activa, que el valor sea físicamente posible ' +
      'para la variable y que la fecha no sea futura.',
  })
  @ApiCreatedResponse({ type: MeasurementResponse })
  @ApiBadRequestResponse({
    type: BadRequestErrorDto,
    description: 'Cuerpo inválido, valor físicamente imposible o fecha futura',
  })
  @ApiNotFoundResponse({ type: NotFoundErrorDto, description: 'La estación no existe' })
  @ApiUnprocessableEntityResponse({
    type: UnprocessableEntityErrorDto,
    description: 'La estación está inactiva',
  })
  @ApiConflictResponse({
    type: ConflictErrorDto,
    description: 'La estación ya registró esa variable en ese instante',
  })
  create(@Body() dto: CreateMeasurementDto): Promise<MeasurementResponse> {
    return this.measurementsService.create(dto);
  }
}
