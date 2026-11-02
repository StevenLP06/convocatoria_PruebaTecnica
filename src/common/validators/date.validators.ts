import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import {
  isDateOrDateTimeWithOffset,
  isDateTimeWithOffset,
  parseDateBoundary,
} from '../utils/date-boundary.util';

/**
 * Valida un filtro de fecha: `YYYY-MM-DD` o fecha-hora ISO 8601 con zona horaria.
 */
export function IsDateFilter(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isDateFilter',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message:
          '$property debe ser una fecha YYYY-MM-DD o una fecha-hora ISO 8601 con zona horaria (p. ej. 2026-10-05T08:00:00-05:00)',
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown): boolean => isDateOrDateTimeWithOffset(value),
      },
    });
  };
}

/**
 * Valida una fecha-hora ISO 8601 con zona horaria obligatoria.
 */
export function IsDateTimeWithOffset(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isDateTimeWithOffset',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message:
          '$property debe ser una fecha-hora ISO 8601 con zona horaria (p. ej. 2026-10-05T08:00:00-05:00)',
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown): boolean => isDateTimeWithOffset(value),
      },
    });
  };
}

/**
 * Valida que un filtro de fecha final no sea anterior al filtro de fecha inicial
 * indicado en `startProperty`. Si alguno de los dos falta o es inválido, no
 * reporta error (de eso se encargan otros validadores).
 */
export function IsNotBeforeDate(
  startProperty: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isNotBeforeDate',
      target: target.constructor,
      propertyName: propertyName.toString(),
      constraints: [startProperty],
      options: {
        message: '$property no puede ser anterior a $constraint1',
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown, args: ValidationArguments): boolean => {
          const [relatedProperty] = args.constraints as [string];
          const startValue = (args.object as Record<string, unknown>)[relatedProperty];

          if (!isDateOrDateTimeWithOffset(value) || !isDateOrDateTimeWithOffset(startValue)) {
            return true;
          }

          return (
            parseDateBoundary(value, 'end').getTime() >=
            parseDateBoundary(startValue, 'start').getTime()
          );
        },
      },
    });
  };
}
