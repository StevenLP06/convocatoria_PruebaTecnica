import { validateSync } from 'class-validator';
import { IsDateFilter, IsDateTimeWithOffset, IsNotBeforeDate } from './date.validators';

class RangeDto {
  @IsDateFilter()
  startDate?: string;

  @IsDateFilter()
  @IsNotBeforeDate('startDate')
  endDate?: string;
}

class InstantDto {
  @IsDateTimeWithOffset()
  measuredAt: string;
}

function rangeErrors(startDate: string, endDate: string): string[] {
  const dto = Object.assign(new RangeDto(), { startDate, endDate });
  return validateSync(dto).flatMap((error) => Object.keys(error.constraints ?? {}));
}

describe('validadores de fecha', () => {
  it('acepta un rango válido', () => {
    expect(rangeErrors('2026-10-01', '2026-10-15')).toEqual([]);
  });

  it('acepta el mismo día como inicio y fin (incluye el día completo)', () => {
    expect(rangeErrors('2026-10-05', '2026-10-05')).toEqual([]);
  });

  it('rechaza una fecha final anterior a la inicial', () => {
    expect(rangeErrors('2026-10-15', '2026-10-01')).toContain('isNotBeforeDate');
  });

  it('compara correctamente fechas con distinta zona horaria', () => {
    // 2026-10-05T04:00:00Z equivale a 2026-10-04T23:00 en Colombia: anterior al inicio.
    expect(rangeErrors('2026-10-05T00:00:00-05:00', '2026-10-05T04:00:00Z')).toContain(
      'isNotBeforeDate',
    );
  });

  it('rechaza formatos inválidos', () => {
    expect(rangeErrors('ayer', '2026-10-01')).toContain('isDateFilter');
  });

  it('exige zona horaria en una fecha-hora de medición', () => {
    const dto = Object.assign(new InstantDto(), { measuredAt: '2026-10-05T10:00:00' });
    expect(validateSync(dto)).toHaveLength(1);
  });
});
