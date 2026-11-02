import {
  isDateOrDateTimeWithOffset,
  isDateTimeWithOffset,
  isRealCalendarDate,
  parseDateBoundary,
} from './date-boundary.util';

describe('parseDateBoundary', () => {
  it('interpreta una fecha sin hora como inicio del día en hora de Colombia', () => {
    expect(parseDateBoundary('2026-10-05', 'start').toISOString()).toBe('2026-10-05T05:00:00.000Z');
  });

  it('interpreta una fecha sin hora como fin del día en hora de Colombia', () => {
    expect(parseDateBoundary('2026-10-05', 'end').toISOString()).toBe('2026-10-06T04:59:59.999Z');
  });

  it('respeta la zona horaria de una fecha-hora explícita', () => {
    expect(parseDateBoundary('2026-10-05T10:00:00-05:00', 'start').toISOString()).toBe(
      '2026-10-05T15:00:00.000Z',
    );
    expect(parseDateBoundary('2026-10-05T10:00:00Z', 'end').toISOString()).toBe(
      '2026-10-05T10:00:00.000Z',
    );
  });
});

describe('isRealCalendarDate', () => {
  it.each(['2026-02-28', '2028-02-29', '2026-12-31T23:59:59Z'])('acepta %s', (value) => {
    expect(isRealCalendarDate(value)).toBe(true);
  });

  it.each(['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-10'])(
    'rechaza %s (no existe en el calendario)',
    (value) => {
      expect(isRealCalendarDate(value)).toBe(false);
    },
  );
});

describe('isDateOrDateTimeWithOffset', () => {
  it.each([
    '2026-10-05',
    '2026-10-05T10:00Z',
    '2026-10-05T10:00:00-05:00',
    '2026-10-05T10:00:00.123+00:00',
  ])('acepta %s', (value) => {
    expect(isDateOrDateTimeWithOffset(value)).toBe(true);
  });

  it.each([
    '2026-10-05T10:00:00', // sin zona horaria
    '05/10/2026',
    '2026-10-05 10:00:00Z',
    '2026-10-05T24:00:00Z',
    '2026-02-30',
    42,
    undefined,
  ])('rechaza %p', (value) => {
    expect(isDateOrDateTimeWithOffset(value)).toBe(false);
  });
});

describe('isDateTimeWithOffset', () => {
  it('exige hora y zona horaria', () => {
    expect(isDateTimeWithOffset('2026-10-05T10:00:00-05:00')).toBe(true);
    expect(isDateTimeWithOffset('2026-10-05')).toBe(false);
    expect(isDateTimeWithOffset('2026-10-05T10:00:00')).toBe(false);
  });
});
