import { Controller, Get, Query } from '@nestjs/common';
import { type AverageResult, type ExtremeResult } from './analytics.mapper';
import {
  type AggregationResponse,
  type AlertsResponse,
  AnalyticsService,
} from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Promedios de las variables ambientales.
   * Filtros: startDate, endDate, stationId, variable. Agrupación: groupBy=variable|station.
   */
  @Get('averages')
  getAverages(@Query() query: AnalyticsQueryDto): Promise<AggregationResponse<AverageResult>> {
    return this.analyticsService.getAverages(query);
  }

  /**
   * Valores máximos y mínimos registrados, con la estación y el instante de cada uno.
   * Filtros: startDate, endDate, stationId, variable. Agrupación: groupBy=variable|station.
   */
  @Get('extremes')
  getExtremes(@Query() query: AnalyticsQueryDto): Promise<AggregationResponse<ExtremeResult>> {
    return this.analyticsService.getExtremes(query);
  }

  /**
   * Mediciones que superan los umbrales de alerta, paginadas y con resumen por variable.
   * Filtros: startDate, endDate, stationId, variable, page, limit, order.
   */
  @Get('alerts')
  getAlerts(@Query() query: ListAlertsQueryDto): Promise<AlertsResponse> {
    return this.analyticsService.getAlerts(query);
  }
}
