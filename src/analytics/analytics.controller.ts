import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BadRequestErrorDto, NotFoundErrorDto } from '../common/dto/error-response.dto';
import { API_TAGS } from '../config/swagger.config';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AlertsResponse, AveragesResponse, ExtremesResponse } from './dto/analytics-response.dto';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';

@ApiTags(API_TAGS.analytics)
@ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Filtros inválidos' })
@ApiNotFoundResponse({ type: NotFoundErrorDto, description: 'La estación filtrada no existe' })
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('averages')
  @ApiOperation({
    summary: 'Promedios de las variables ambientales',
    description:
      'Filtros: fecha inicial, fecha final, estación y variable. ' +
      'Con groupBy=station se obtiene un promedio por estación y variable.',
  })
  @ApiOkResponse({ type: AveragesResponse })
  getAverages(@Query() query: AnalyticsQueryDto): Promise<AveragesResponse> {
    return this.analyticsService.getAverages(query);
  }

  @Get('extremes')
  @ApiOperation({
    summary: 'Valores máximos y mínimos registrados',
    description:
      'Incluye la estación y el instante en que se registró cada valor. Si un valor ' +
      'extremo se repite, se reporta su primera ocurrencia. Mismos filtros y agrupación ' +
      'que los promedios.',
  })
  @ApiOkResponse({ type: ExtremesResponse })
  getExtremes(@Query() query: AnalyticsQueryDto): Promise<ExtremesResponse> {
    return this.analyticsService.getExtremes(query);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Alertas: mediciones que superan los umbrales',
    description:
      'Una medición genera alerta si es estrictamente mayor que el umbral máximo o menor ' +
      'que el mínimo de su variable. Incluye el umbral superado, un resumen por variable ' +
      'y paginación.',
  })
  @ApiOkResponse({ type: AlertsResponse })
  getAlerts(@Query() query: ListAlertsQueryDto): Promise<AlertsResponse> {
    return this.analyticsService.getAlerts(query);
  }
}
