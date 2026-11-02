#!/usr/bin/env node
/**
 * Inicializa la base de datos: aplica las migraciones pendientes y carga los
 * datos sintéticos según el modo indicado en SEED_DATABASE.
 *
 *   if-empty (por defecto) → carga los datos solo si no hay mediciones. Así un
 *                            reinicio del contenedor no borra los datos registrados.
 *   always                 → recarga siempre los datos sintéticos (el seed es idempotente).
 *   never                  → solo aplica migraciones.
 *
 * Uso: node scripts/db-init.js   (requiere DATABASE_URL)
 *
 * Se escribe en JavaScript plano para poder ejecutarlo sin compilar, tanto en el
 * contenedor de migración como en local (npm run db:init).
 */
'use strict';

const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const SCHEMA_PATH = 'prisma/schema.prisma';
const SEED_PATH = 'prisma/seed/seed.sql';
const SEED_MODES = ['if-empty', 'always', 'never'];

// Se invoca el CLI de Prisma con el mismo Node, sin depender de npx ni del shell.
const PRISMA_CLI = require.resolve('prisma/build/index.js');

function log(message) {
  console.log(`[db-init] ${message}`);
}

function runPrisma(args) {
  const result = spawnSync(process.execPath, [PRISMA_CLI, ...args], { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Falló el comando: prisma ${args.join(' ')}`);
  }
}

async function countMeasurements() {
  const prisma = new PrismaClient();
  try {
    return await prisma.measurement.count();
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const mode = process.env.SEED_DATABASE || 'if-empty';

  if (!SEED_MODES.includes(mode)) {
    throw new Error(`SEED_DATABASE debe ser uno de: ${SEED_MODES.join(', ')} (recibido: ${mode})`);
  }

  log('Aplicando migraciones...');
  runPrisma(['migrate', 'deploy', '--schema', SCHEMA_PATH]);

  if (mode === 'never') {
    log('SEED_DATABASE=never: no se cargan datos sintéticos.');
    return;
  }

  if (mode === 'if-empty') {
    const total = await countMeasurements();
    if (total > 0) {
      log(`La base ya tiene ${total} mediciones: no se cargan datos sintéticos.`);
      return;
    }
  }

  log('Cargando datos sintéticos...');
  runPrisma(['db', 'execute', '--file', SEED_PATH, '--schema', SCHEMA_PATH]);
  log('Datos sintéticos cargados.');
}

main().catch((error) => {
  console.error(`[db-init] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
