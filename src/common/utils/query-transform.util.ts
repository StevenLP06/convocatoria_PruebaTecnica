import { type TransformFnParams } from 'class-transformer';

/**
 * Convierte 'true' / 'false' de un query string a booleano.
 * Nota: no se usa `@Type(() => Boolean)` porque convierte la cadena 'false' en `true`.
 * Cualquier otro valor se deja intacto para que `@IsBoolean()` lo rechace.
 */
export function toBoolean({ value }: TransformFnParams): unknown {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
}

/** Normaliza a mayúsculas (p. ej. `?variable=pm25` → `PM25`). */
export function toUpperCase({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

/** Normaliza a minúsculas (p. ej. `?order=DESC` → `desc`). */
export function toLowerCase({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
