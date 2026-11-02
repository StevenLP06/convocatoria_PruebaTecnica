import { type Variable, type VariableCode } from '@prisma/client';
import { nullableDecimalToNumber } from '../common/utils/decimal.util';

export interface VariableResponse {
  id: number;
  code: VariableCode;
  name: string;
  unit: string;
  /**
   * Umbrales de alerta. Una medición genera alerta si es estrictamente menor que
   * `min` o estrictamente mayor que `max`. `null` = sin límite en ese sentido.
   */
  alertThresholds: {
    min: number | null;
    max: number | null;
  };
}

export function toVariableResponse(variable: Variable): VariableResponse {
  return {
    id: variable.id,
    code: variable.code,
    name: variable.name,
    unit: variable.unit,
    alertThresholds: {
      min: nullableDecimalToNumber(variable.alertMin),
      max: nullableDecimalToNumber(variable.alertMax),
    },
  };
}
