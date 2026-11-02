import { Injectable, NotFoundException } from '@nestjs/common';
import { VariableCode } from '@prisma/client';
import { buildPaginationMeta } from '../common/dto/paginated-response';
import { type MeasurementFilterDto } from '../measurements/dto/measurement-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  toAlertResult,
  toAppliedFilters,
  toAverageResult,
  toExtremeResult,
} from './analytics.mapper';
import {
  alertCountsQuery,
  alertsQuery,
  type AlertCountRow,
  type AlertRow,
  type AverageRow,
  averagesQuery,
  type ExtremeRow,
  extremesQuery,
} from './analytics.queries';
import { type AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  type AlertsResponse,
  type AveragesResponse,
  type ExtremesResponse,
} from './dto/analytics-response.dto';
import { type ListAlertsQueryDto } from './dto/list-alerts-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Promedio de cada variable (por estación si `groupBy=station`). */
  async getAverages(query: AnalyticsQueryDto): Promise<AveragesResponse> {
    await this.assertStationExists(query.stationId);

    const rows = await this.prisma.$queryRaw<AverageRow[]>(averagesQuery(query, query.groupBy));

    return {
      filters: { ...toAppliedFilters(query), groupBy: query.groupBy },
      data: rows.map(toAverageResult),
    };
  }

  /**
   * Máximo y mínimo registrados de cada variable, con la estación y el instante
   * en que ocurrieron.
   */
  async getExtremes(query: AnalyticsQueryDto): Promise<ExtremesResponse> {
    await this.assertStationExists(query.stationId);

    const rows = await this.prisma.$queryRaw<ExtremeRow[]>(extremesQuery(query, query.groupBy));

    return {
      filters: { ...toAppliedFilters(query), groupBy: query.groupBy },
      data: rows.map(toExtremeResult),
    };
  }

  /** Mediciones que superan los umbrales de su variable, paginadas y con resumen por variable. */
  async getAlerts(query: ListAlertsQueryDto): Promise<AlertsResponse> {
    await this.assertStationExists(query.stationId);

    // Página y conteos en la misma transacción para que sean consistentes entre sí.
    const [rows, counts] = await this.prisma.$transaction([
      this.prisma.$queryRaw<AlertRow[]>(alertsQuery(query, query.page, query.limit, query.order)),
      this.prisma.$queryRaw<AlertCountRow[]>(alertCountsQuery(query)),
    ]);

    const byVariable = this.countsByVariable(counts, query);
    const totalAlerts = counts.reduce((total, row) => total + row.count, 0);

    return {
      filters: toAppliedFilters(query),
      summary: { totalAlerts, byVariable },
      data: rows.map(toAlertResult),
      meta: buildPaginationMeta(query.page, query.limit, totalAlerts),
    };
  }

  /**
   * Conteo por variable que incluye en 0 las variables sin alertas (todas, o solo
   * la filtrada), para que la respuesta tenga siempre la misma forma.
   */
  private countsByVariable(
    counts: AlertCountRow[],
    filter: MeasurementFilterDto,
  ): Partial<Record<VariableCode, number>> {
    const codes = filter.variable ? [filter.variable] : Object.values(VariableCode);
    const result: Partial<Record<VariableCode, number>> = {};

    for (const code of codes) {
      result[code] = counts.find((row) => row.variableCode === code)?.count ?? 0;
    }

    return result;
  }

  /**
   * Un id de estación inexistente produciría resultados vacíos indistinguibles de
   * "no hubo mediciones": se responde 404 para que el error sea explícito.
   */
  private async assertStationExists(stationId: number | undefined): Promise<void> {
    if (stationId === undefined) {
      return;
    }

    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      select: { id: true },
    });

    if (!station) {
      throw new NotFoundException(`No existe la estación con id ${stationId}`);
    }
  }
}
