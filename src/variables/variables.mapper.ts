import { type Variable } from '@prisma/client';
import { nullableDecimalToNumber } from '../common/utils/decimal.util';
import { type VariableResponse } from './dto/variable-response.dto';

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
