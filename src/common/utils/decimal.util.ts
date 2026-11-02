import { type Prisma } from '@prisma/client';

/**
 * Convierte un Decimal de Prisma a number para la respuesta JSON.
 * Seguro en este dominio: los valores tienen como máximo 8 dígitos y 2 decimales,
 * muy por debajo del límite de precisión de un double.
 */
export function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export function nullableDecimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}
