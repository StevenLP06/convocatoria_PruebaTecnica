import { VariableCode } from '@prisma/client';
import { isWithinPhysicalLimits, PHYSICAL_LIMITS } from './variable-limits';

describe('isWithinPhysicalLimits', () => {
  it('define límites para todas las variables', () => {
    expect(Object.keys(PHYSICAL_LIMITS).sort()).toEqual(Object.values(VariableCode).sort());
  });

  it.each([
    [VariableCode.HUMIDITY, 100, true],
    [VariableCode.HUMIDITY, 100.01, false],
    [VariableCode.PH, 0, true],
    [VariableCode.PH, 14.5, false],
    [VariableCode.PRECIPITATION, -0.1, false],
    [VariableCode.PM25, 31.4, true],
    [VariableCode.TEMPERATURE, -5, true],
  ])('%s = %d → %s', (variable, value, expected) => {
    expect(isWithinPhysicalLimits(variable, value)).toBe(expected);
  });
});
