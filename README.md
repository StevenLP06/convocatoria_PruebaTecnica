# SAT Environmental API

API REST para almacenar, consultar y analizar mediciones ambientales provenientes de
estaciones de monitoreo (temperatura, humedad relativa, PM2.5, precipitación y pH).

> 🚧 Proyecto en construcción. Este README se completará en la fase final con la
> documentación de endpoints, Docker y datos sintéticos.

## Stack

NestJS · TypeScript · PostgreSQL · Prisma · Swagger/OpenAPI · Docker

## Requisitos

- Node.js 20.11 o superior (ver `.nvmrc`)
- PostgreSQL 16

## Puesta en marcha local

```bash
npm install                 # instala dependencias y genera el cliente de Prisma
cp .env.example .env        # ajusta DATABASE_URL a tu PostgreSQL
npm run db:migrate          # aplica las migraciones
npm run start:dev           # API en http://localhost:3000/api/v1
```

## Documentación

- [Modelo de base de datos](docs/database-model.md)
