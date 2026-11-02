import { APP_UTC_OFFSET } from '../constants/app.constants';

/** Fecha sin hora: YYYY-MM-DD. */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fecha-hora ISO 8601 con zona horaria explícita (Z o ±HH:MM).
 * Se exige la zona para evitar ambigüedades: sin ella, el instante dependería
 * de la zona horaria del servidor.
 */
export const DATE_TIME_WITH_OFFSET_PATTERN =
  /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export type DateBoundary = 'start' | 'end';

/**
 * Verifica que la parte de fecha (YYYY-MM-DD) exista en el calendario.
 * Necesario porque `new Date('2026-02-30')` no falla: JavaScript lo "corrige"
 * silenciosamente al 2 de marzo.
 */
export function isRealCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return false;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Fecha (YYYY-MM-DD) o fecha-hora con zona, con fecha existente en el calendario. */
export function isDateOrDateTimeWithOffset(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (DATE_ONLY_PATTERN.test(value) || DATE_TIME_WITH_OFFSET_PATTERN.test(value)) &&
    isRealCalendarDate(value)
  );
}

/** Fecha-hora con zona, con fecha existente en el calendario. */
export function isDateTimeWithOffset(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    DATE_TIME_WITH_OFFSET_PATTERN.test(value) &&
    isRealCalendarDate(value)
  );
}

/**
 * Convierte el valor de un filtro de fecha en un instante concreto.
 *
 * - Fecha sin hora (YYYY-MM-DD): se interpreta como un día completo en hora de
 *   Colombia. Como límite inicial equivale a las 00:00:00.000 y como límite final
 *   a las 23:59:59.999, de modo que `endDate=2026-10-05` incluye todo ese día.
 * - Fecha-hora con zona: se usa tal cual.
 *
 * Se asume que el valor ya fue validado con `isDateOrDateTimeWithOffset`.
 */
export function parseDateBoundary(value: string, boundary: DateBoundary): Date {
  if (DATE_ONLY_PATTERN.test(value)) {
    const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';
    return new Date(`${value}T${time}${APP_UTC_OFFSET}`);
  }

  return new Date(value);
}
