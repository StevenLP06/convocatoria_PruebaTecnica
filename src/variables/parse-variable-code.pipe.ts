import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { VariableCode } from '@prisma/client';

const VALID_CODES = Object.values(VariableCode) as string[];

/**
 * Valida un código de variable en la ruta (sin distinguir mayúsculas):
 * `/variables/pm25` y `/variables/PM25` son equivalentes.
 */
@Injectable()
export class ParseVariableCodePipe implements PipeTransform<string, VariableCode> {
  transform(value: string): VariableCode {
    const code = value.trim().toUpperCase();

    if (!VALID_CODES.includes(code)) {
      throw new BadRequestException(
        `Variable "${value}" no válida. Valores permitidos: ${VALID_CODES.join(', ')}`,
      );
    }

    return code as VariableCode;
  }
}
