# SAT Environmental API

API REST para almacenar, consultar y analizar mediciones ambientales provenientes de
estaciones de monitoreo (temperatura, humedad relativa, PM2.5, precipitación y pH).

> 🚧 Proyecto en construcción. Este README se completará en la fase final con la
> documentación de endpoints, Docker y datos sintéticos.

## Stack

NestJS · TypeScript · PostgreSQL · Prisma · Swagger/OpenAPI · Docker

## Puesta en marcha con Docker (recomendada)

Requisito: Docker con Docker Compose v2.

```bash
docker compose up --build
```

Un solo comando levanta todo el entorno, en este orden:

| Servicio | Qué hace |
|---|---|
| `db` | PostgreSQL 16. Los demás servicios esperan a que esté sano (`pg_isready`). |
| `migrate` | Aplica las migraciones de Prisma y carga los datos sintéticos si la base está vacía. Termina al acabar. |
| `api` | Arranca la API cuando `migrate` terminó con éxito. Su estado se verifica con `GET /api/v1/health`. |

Cuando la terminal muestre `API escuchando en http://localhost:3000/api/v1`:

- API: <http://localhost:3000/api/v1>
- Swagger: <http://localhost:3000/api/docs>
- Estado: <http://localhost:3000/api/v1/health>

Comandos útiles:

```bash
docker compose up --build -d                            # en segundo plano
docker compose ps                                       # estado y salud de los servicios
docker compose logs -f api                              # logs de la API
docker compose run --rm -e SEED_DATABASE=always migrate # recargar los datos sintéticos
docker compose down                                     # detener (conserva los datos)
docker compose down -v                                  # detener y borrar la base de datos
```

**Configuración:** todas las variables tienen valores por defecto, así que no hace falta un
`.env`. Para cambiarlas, copia `.env.example` como `.env`. Por defecto PostgreSQL se publica en
el puerto **5433** del equipo, para no chocar con un PostgreSQL local en el 5432.

**Datos sintéticos (`SEED_DATABASE`):**

- `if-empty` (por defecto): los carga solo si no hay mediciones, así que reiniciar los
  contenedores no borra lo registrado por la API.
- `always`: los recarga siempre.
- `never`: solo aplica las migraciones.

**Imagen de la API:** Dockerfile multi-stage. La imagen final contiene solo las dependencias de
producción y el código compilado, se ejecuta con un usuario sin privilegios (`node`) e incluye
un `HEALTHCHECK`.

## Puesta en marcha local (sin Docker)

Requisitos: Node.js 24 LTS (ver `.nvmrc`; la misma versión que usa la imagen de Docker) y PostgreSQL 16.

```bash
npm install                 # instala dependencias y genera el cliente de Prisma
cp .env.example .env        # ajusta DATABASE_URL a tu PostgreSQL
npm run db:init             # aplica las migraciones y carga los datos sintéticos
npm run start:dev           # API en http://localhost:3000/api/v1
```

`npm run db:reset` recrea la base desde cero: la borra, aplica las migraciones y carga los
datos.

## Documentación de la API (Swagger / OpenAPI)

Con la API en ejecución:

- **Swagger UI:** <http://localhost:3000/api/docs>. Permite explorar y probar cada endpoint
  con sus filtros, cuerpos de ejemplo, respuestas y códigos de error.
- **Especificación OpenAPI (JSON):** <http://localhost:3000/api/docs-json>, importable en
  Postman, Insomnia u otras herramientas.

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
| GET | `/analytics/averages` | Promedios. Filtros: `startDate`, `endDate`, `stationId`, `variable`, `groupBy` |
| GET | `/analytics/extremes` | Máximos y mínimos con estación e instante. Mismos filtros que promedios |
| GET | `/analytics/alerts` | Mediciones que superan los umbrales, con resumen por variable. Filtros: `startDate`, `endDate`, `stationId`, `variable`, `page`, `limit`, `order` |
| GET | `/health` | Estado del servicio y de la conexión a la base de datos (200 / 503) |

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

## Análisis ambiental

**Agrupación (`groupBy`)** en promedios y extremos:

- `variable` (por defecto): un resultado por variable, combinando las estaciones filtradas.
- `station`: un resultado por cada combinación de estación y variable.

**Alertas:** una medición genera alerta si su valor es estrictamente mayor que el umbral
máximo o estrictamente menor que el mínimo de su variable (ver `GET /variables`). Un valor
exactamente igual al umbral **no** es alerta. Cada alerta indica la condición
(`ABOVE_MAX` / `BELOW_MIN`) y el umbral superado.

```bash
# Promedio de cada variable por estación durante la primera semana de octubre
curl "http://localhost:3000/api/v1/analytics/averages?groupBy=station&startDate=2026-10-01&endDate=2026-10-07"

# Temperatura máxima y mínima registradas (y dónde/cuándo)
curl "http://localhost:3000/api/v1/analytics/extremes?variable=temperature"

# Alertas de calidad del agua
curl "http://localhost:3000/api/v1/analytics/alerts?variable=ph"
```

Respuesta de `GET /analytics/extremes?variable=temperature` con los datos sintéticos:

```json
{
  "filters": { "from": null, "to": null, "stationId": null, "variable": "TEMPERATURE", "groupBy": "variable" },
  "data": [
    {
      "variable": { "code": "TEMPERATURE", "name": "Temperatura ambiental", "unit": "°C" },
      "station": null,
      "count": 500,
      "max": {
        "value": 36.2,
        "measuredAt": "2026-10-14T17:00:00.000Z",
        "station": { "id": 5, "code": "CHN-01", "name": "Chinchiná - Rural" }
      },
      "min": {
        "value": 7.3,
        "measuredAt": "2026-10-09T07:24:00.000Z",
        "station": { "id": 3, "code": "MZL-03", "name": "Manizales - Río Blanco" }
      }
    }
  ]
}
```

Respuesta de `GET /analytics/alerts?variable=ph&limit=1`:

```json
{
  "filters": { "from": null, "to": null, "stationId": null, "variable": "PH" },
  "summary": { "totalAlerts": 2, "byVariable": { "PH": 2 } },
  "data": [
    {
      "id": 2205,
      "value": 9.31,
      "measuredAt": "2026-10-27T14:36:00.000Z",
      "station": { "id": 5, "code": "CHN-01", "name": "Chinchiná - Rural" },
      "variable": { "code": "PH", "name": "Calidad del agua (pH)", "unit": "pH" },
      "condition": "ABOVE_MAX",
      "threshold": 9
    }
  ],
  "meta": { "page": 1, "limit": 1, "totalItems": 2, "totalPages": 2 }
}
```

Las fechas de las respuestas están en UTC (`2026-10-14T17:00:00.000Z` = 14 de octubre, 12:00 en
Colombia).

## Documentación

- [Modelo de base de datos](docs/database-model.md)
- [Datos sintéticos](docs/synthetic-data.md)
