import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { MAX_INT_ID } from '../constants/app.constants';

/**
 * Valida y convierte un identificador numérico de ruta (p. ej. `/stations/:id`).
 * Rechaza valores no enteros, no positivos o fuera del rango de INTEGER de
 * PostgreSQL, que de otro modo producirían un error 500 en la base de datos.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = /^\d+$/.test(value) ? Number(value) : Number.NaN;

    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INT_ID) {
      throw new BadRequestException(`El identificador "${value}" no es válido`);
    }

    return id;
  }
}
