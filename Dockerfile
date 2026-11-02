# syntax=docker/dockerfile:1

# =============================================================================
# SAT Environmental API - imagen multi-stage
#
#   build    → dependencias completas, cliente de Prisma y compilación de TypeScript.
#              También la usa el servicio de migración (necesita el CLI de Prisma).
#   runtime  → imagen final: solo dependencias de producción y código compilado,
#              ejecutada con un usuario sin privilegios.
# =============================================================================

ARG NODE_VERSION=22

# -----------------------------------------------------------------------------
# base: Node + OpenSSL (lo requieren los motores de Prisma en Alpine)
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# -----------------------------------------------------------------------------
# build
# -----------------------------------------------------------------------------
FROM base AS build

# Primero solo los manifiestos y el schema: esta capa (la más lenta) se reutiliza
# mientras no cambien las dependencias. El schema se copia antes de instalar
# porque el postinstall ejecuta `prisma generate`.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# -----------------------------------------------------------------------------
# prod-deps: las dependencias de build sin las de desarrollo
#
# Se parte de lo ya instalado en build y se eliminan las devDependencies con
# `npm prune`, en lugar de hacer una segunda instalación con `npm ci --omit=dev`:
#   - la imagen final usa exactamente las mismas versiones que se compilaron;
#   - se evita un fallo conocido de npm ("package.json and package-lock.json are
#     not in sync") con lockfiles generados en otro sistema operativo.
# -----------------------------------------------------------------------------
FROM build AS prod-deps
RUN npm prune --omit=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# runtime
# -----------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
# El cliente de Prisma generado vive en node_modules/.prisma; se copia explícitamente
# desde build para no depender de que `npm prune` lo conserve.
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/v1/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
