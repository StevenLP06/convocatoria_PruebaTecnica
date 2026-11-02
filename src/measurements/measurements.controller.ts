import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { type PaginatedResponse } from '../common/dto/paginated-response';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { ListMeasurementsQueryDto } from './dto/list-measurements-query.dto';
import { type MeasurementResponse } from './measurements.mapper';
import { MeasurementsService } from './measurements.service';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  /**
   * Lista paginada de mediciones con filtros por rango de fechas, estación y variable.
   */
  @Get()
  findAll(
    @Query() query: ListMeasurementsQueryDto,
  ): Promise<PaginatedResponse<MeasurementResponse>> {
    return this.measurementsService.findAll(query);
  }

  /** Detalle de una medición. */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number): Promise<MeasurementResponse> {
    return this.measurementsService.findOne(id);
  }

  /** Registra una nueva medición (responde 201 con la medición creada). */
  @Post()
  create(@Body() dto: CreateMeasurementDto): Promise<MeasurementResponse> {
    return this.measurementsService.create(dto);
  }
}
