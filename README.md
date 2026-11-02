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
npm run db:setup            # aplica las migraciones y carga los datos sintéticos
npm run start:dev           # API en http://localhost:3000/api/v1
```

## Endpoints disponibles

Todas las rutas cuelgan de `/api/v1`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/municipalities` | Municipios con su cantidad de estaciones |
| GET | `/municipalities/:id` | Detalle de un municipio con sus estaciones |
| GET | `/stations` | Estaciones. Filtros: `municipalityId`, `type` (URBAN/RURAL), `isActive` |
| GET | `/stations/:id` | Detalle de una estación |
| GET | `/variables` | Variables con unidad y umbrales de alerta |
| GET | `/variables/:code` | Detalle de una variable (p. ej. `PM25`) |
| GET | `/measurements` | Mediciones paginadas. Filtros: `startDate`, `endDate`, `stationId`, `variable`, `page`, `limit`, `order` |
| GET | `/measurements/:id` | Detalle de una medición |
| POST | `/measurements` | Registra una medición |

**Fechas:** `startDate` y `endDate` aceptan `YYYY-MM-DD` (día completo en hora de Colombia)
o fecha-hora ISO 8601 con zona horaria. Ambos extremos son inclusivos.

```bash
# PM2.5 de la estación MZL-01 el 7 de octubre de 2026
curl "http://localhost:3000/api/v1/measurements?stationId=1&variable=pm25&startDate=2026-10-07&endDate=2026-10-07&order=asc"

# Registrar una medición
curl -X POST http://localhost:3000/api/v1/measurements \
  -H "Content-Type: application/json" \
  -d '{"stationId":1,"variable":"TEMPERATURE","value":18.4,"measuredAt":"2026-10-31T08:00:00-05:00"}'
```

## Documentación

- [Modelo de base de datos](docs/database-model.md)
- [Datos sintéticos](docs/synthetic-data.md)
