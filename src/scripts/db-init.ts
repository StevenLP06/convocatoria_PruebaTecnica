/**
 * Inicializa la base de datos: aplica las migraciones pendientes y carga los
 * datos sintéticos según el modo indicado en SEED_DATABASE.
 *
 *   if-empty (por defecto) → carga los datos solo si no hay mediciones. Así un
 *                            reinicio del contenedor no borra los datos registrados.
 *   always                 → recarga siempre los datos sintéticos (el seed es idempotente).
 *   never                  → solo aplica migraciones.
 *
 * Se compila con el resto del proyecto (`nest build` → dist/scripts/db-init.js).
 *   - Docker (servicio migrate): node dist/scripts/db-init.js
 *   - Local:                     npm run db:init
 *
 * Requiere DATABASE_URL y debe ejecutarse desde la raíz del proyecto.
 */
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';

export const SEED_MODES = ['if-empty', 'always', 'never'] as const;
export type SeedMode = (typeof SEED_MODES)[number];

const SCHEMA_PATH = 'prisma/schema.prisma';
const SEED_PATH = 'prisma/seed/seed.sql';

const logger = new Logger('DbInit');

/** Valida SEED_DATABASE; si no viene, usa `if-empty`. */
export function parseSeedMode(value: string | undefined): SeedMode {
  const mode = value === undefined || value.trim() === '' ? 'if-empty' : value.trim();

  if (!(SEED_MODES as readonly string[]).includes(mode)) {
    throw new Error(`SEED_DATABASE debe ser uno de: ${SEED_MODES.join(', ')} (recibido: ${mode})`);
  }

  return mode as SeedMode;
}

/** Decide si se cargan los datos sintéticos según el modo y las mediciones existentes. */
export function shouldSeed(mode: SeedMode, existingMeasurements: number): boolean {
  switch (mode) {
    case 'always':
      return true;
    case 'never':
      return false;
    case 'if-empty':
      return existingMeasurements === 0;
  }
}

/** Ejecuta el CLI de Prisma con el mismo Node, sin depender de npx ni del shell. */
function runPrisma(args: string[]): void {
  const prismaCli = require.resolve('prisma/build/index.js');
  const result = spawnSync(process.execPath, [prismaCli, ...args], { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Falló el comando: prisma ${args.join(' ')}`);
  }
}

async function countMeasurements(): Promise<number> {
  const prisma = new PrismaClient();
  try {
    return await prisma.measurement.count();
  } finally {
    await prisma.$disconnect();
  }
}

export async function initDatabase(): Promise<void> {
  const mode = parseSeedMode(process.env.SEED_DATABASE);

  logger.log('Aplicando migraciones...');
  runPrisma(['migrate', 'deploy', '--schema', SCHEMA_PATH]);

  // Solo se consulta la base cuando el modo depende de su contenido.
  const existing = mode === 'if-empty' ? await countMeasurements() : 0;

  if (!shouldSeed(mode, existing)) {
    logger.log(
      mode === 'never'
        ? 'SEED_DATABASE=never: no se cargan datos sintéticos.'
        : `La base ya tiene ${existing} mediciones: no se cargan datos sintéticos.`,
    );
    return;
  }

  logger.log('Cargando datos sintéticos...');
  runPrisma(['db', 'execute', '--file', SEED_PATH, '--schema', SCHEMA_PATH]);
  logger.log('Datos sintéticos cargados.');
}

// Solo se ejecuta al invocarse directamente (no al importarse desde las pruebas).
if (require.main === module) {
  initDatabase().catch((error: unknown) => {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
