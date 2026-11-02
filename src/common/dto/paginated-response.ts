import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ description: 'Página actual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Elementos por página', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total de elementos que cumplen los filtros', example: 500 })
  totalItems: number;

  @ApiProperty({ description: 'Total de páginas', example: 25 })
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}

/** Cantidad de registros a omitir para una página dada. */
export function paginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
