import { VariableCode } from '@prisma/client';

export interface PhysicalLimits {
  min: number;
  max: number;
}

/**
 * Rangos físicamente posibles de cada variable. No son umbrales de alerta
 * (esos viven en la tabla `variables`): sirven para rechazar mediciones
 * imposibles por error de sensor o de digitación (p. ej. humedad de 140 %).
 */
export const PHYSICAL_LIMITS: Readonly<Record<VariableCode, PhysicalLimits>> = {
  [VariableCode.TEMPERATURE]: { min: -60, max: 60 },
  [VariableCode.HUMIDITY]: { min: 0, max: 100 },
  [VariableCode.PM25]: { min: 0, max: 1000 },
  [VariableCode.PRECIPITATION]: { min: 0, max: 500 },
  [VariableCode.PH]: { min: 0, max: 14 },
};

export function isWithinPhysicalLimits(variable: VariableCode, value: number): boolean {
  const { min, max } = PHYSICAL_LIMITS[variable];
  return value >= min && value <= max;
}
