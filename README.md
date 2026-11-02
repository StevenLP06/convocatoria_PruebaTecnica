# SAT Environmental API

API REST para almacenar, consultar y analizar mediciones ambientales provenientes de
estaciones de monitoreo: temperatura, humedad relativa, material particulado PM2.5,
precipitación y calidad del agua (pH).

Permite consultar promedios, valores máximos y mínimos, y alertas (mediciones que superan
los umbrales definidos), con filtros por rango de fechas, estación y variable.

Prueba técnica de la convocatoria 21 (SAT), Universidad Nacional de Colombia, sede Manizales.

## Contenido

- [Requisitos de la prueba y dónde se cumplen](#requisitos-de-la-prueba-y-dónde-se-cumplen)
- [Inicio rápido con Docker](#inicio-rápido-con-docker)
- [Ejecución local sin Docker](#ejecución-local-sin-docker)
- [Documentación de la API](#documentación-de-la-api)
- [Análisis ambiental](#análisis-ambiental)
- [Datos sintéticos](#datos-sintéticos)
- [Modelo de datos](#modelo-de-datos)
- [Decisiones técnicas](#decisiones-técnicas)
- [Pruebas](#pruebas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Scripts y variables de entorno](#scripts-y-variables-de-entorno)

## Requisitos de la prueba y dónde se cumplen

| Requisito | Implementación |
|---|---|
| Backend NestJS + TypeScript | Todo el código de la aplicación está en `src/` (TypeScript estricto) |
| PostgreSQL + ORM Prisma | `prisma/schema.prisma`, migraciones versionadas en `prisma/migrations/` y `PrismaService` |
| API REST | Rutas bajo `/api/v1` ([endpoints](#endpoints)) |
| Documentación Swagger / OpenAPI | Swagger UI en `/api/docs` y especificación en `/api/docs-json` |
| Control de versiones Git | Historial con commits convencionales, uno por propósito |
| Contenedores Docker | `Dockerfile` multi-stage y `docker-compose.yml` |
| Promedios, máximos y mínimos, alertas | `GET /analytics/averages`, `/analytics/extremes`, `/analytics/alerts` |
| Umbrales de alerta del enunciado | Catálogo de variables en `prisma/migrations/20261101000100_variable_catalog` |
| Filtros por fecha inicial, fecha final, estación y variable | Parámetros `startDate`, `endDate`, `stationId` y `variable` en los endpoints de análisis y de mediciones |
| Archivo SQL de datos sintéticos | `prisma/seed/seed.sql`: 5 estaciones, 3 municipios, 100 mediciones por estación en 30 días, con alertas |
| Modelo de base de datos | [docs/database-model.md](docs/database-model.md) (diagrama entidad-relación y decisiones) |
| README | Este archivo |
| Sin frontend | Solo backend |

## Inicio rápido con Docker

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

- Swagger: <http://localhost:3000/api/docs>
- Estado: <http://localhost:3000/api/v1/health>
- Alertas: <http://localhost:3000/api/v1/analytics/alerts>

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
`.env`. Para cambiarlas, copia `.env.example` como `.env`. PostgreSQL se publica en el puerto
**5433** del equipo, para no chocar con un PostgreSQL local en el 5432.

**Carga de datos (`SEED_DATABASE`):**

- `if-empty` (por defecto): los carga solo si no hay mediciones, así que reiniciar los
  contenedores no borra lo registrado por la API.
- `always`: los recarga siempre.
- `never`: solo aplica las migraciones.

## Ejecución local sin Docker

Requisitos: Node.js 24 LTS (ver `.nvmrc`; la misma versión que usa la imagen de Docker) y
PostgreSQL 16.

```bash
npm install                 # instala dependencias y genera el cliente de Prisma
cp .env.example .env        # ajusta DATABASE_URL a tu PostgreSQL
npm run db:init             # aplica las migraciones y carga los datos sintéticos
npm run start:dev           # API en http://localhost:3000/api/v1
```

`npm run db:reset` recrea la base desde cero: la borra, aplica las migraciones y carga los
datos.

## Documentación de la API

La documentación interactiva está en **Swagger UI** (<http://localhost:3000/api/docs>). Ahí se
puede probar cada endpoint con sus filtros, cuerpos de ejemplo, respuestas y códigos de error.
La especificación OpenAPI en JSON (<http://localhost:3000/api/docs-json>) se puede importar en
Postman o Insomnia.

### Endpoints

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
| GET | `/analytics/extremes` | Máximos y mínimos, con la estación y el instante de cada uno. Mismos filtros que promedios |
| GET | `/analytics/alerts` | Mediciones que superan los umbrales, con resumen por variable. Filtros: `startDate`, `endDate`, `stationId`, `variable`, `page`, `limit`, `order` |
| GET | `/health` | Estado del servicio y de la conexión a la base de datos (200 / 503) |

### Filtros

- **Fechas (`startDate`, `endDate`):** `YYYY-MM-DD` se interpreta como el día completo en hora
  de Colombia (`endDate=2026-10-07` incluye hasta las 23:59:59.999 de ese día). También se
  acepta fecha-hora ISO 8601 con zona horaria (`2026-10-07T08:00:00-05:00`). Ambos extremos
  son inclusivos. Se rechazan fechas inexistentes (30 de febrero) y rangos invertidos.
- **Variable:** `TEMPERATURE`, `HUMIDITY`, `PM25`, `PRECIPITATION` o `PH`, sin distinguir
  mayúsculas.
- **Respuestas:** las fechas se devuelven en UTC (`2026-10-14T17:00:00.000Z` = 14 de octubre,
  12:00 en Colombia).

### Errores

Todas las respuestas de error tienen la forma `{ statusCode, error, message }`:

| Código | Cuándo |
|---|---|
| 400 | Filtros o cuerpo inválidos, valor físicamente imposible, fecha futura |
| 404 | La estación, variable, municipio o medición no existe |
| 409 | La estación ya registró esa variable en ese instante |
| 422 | La estación está inactiva y no puede registrar mediciones |
| 503 | La base de datos no responde (solo `/health`) |

### Ejemplos

```bash
# PM2.5 de la estación MZL-01 el 7 de octubre de 2026
curl "http://localhost:3000/api/v1/measurements?stationId=1&variable=pm25&startDate=2026-10-07&endDate=2026-10-07&order=asc"

# Registrar una medición
curl -X POST http://localhost:3000/api/v1/measurements \
  -H "Content-Type: application/json" \
  -d '{"stationId":1,"variable":"TEMPERATURE","value":18.4,"measuredAt":"2026-10-31T08:00:00-05:00"}'
```

## Análisis ambiental

### Umbrales de alerta

| Variable | Código | Condición de alerta |
|---|---|---|
| Temperatura | `TEMPERATURE` | Mayor a 35 °C |
| Humedad relativa | `HUMIDITY` | Mayor a 95 % |
| PM2.5 | `PM25` | Mayor a 25 µg/m³ |
| Precipitación | `PRECIPITATION` | Mayor a 50 mm |
| pH | `PH` | Menor a 6 o mayor a 9 |

La comparación es **estricta**, como en el enunciado ("mayor a", "menor a"): un valor
exactamente igual al umbral no es alerta. Cada alerta indica la condición (`ABOVE_MAX` /
`BELOW_MIN`) y el umbral superado.

### Agrupación (`groupBy`) en promedios y extremos

- `variable` (por defecto): un resultado por variable, combinando las estaciones filtradas.
  En este modo `station` es `null`; la estación filtrada, si la hay, aparece en
  `filters.stationId`.
- `station`: un resultado por cada combinación de estación y variable.

Los extremos indican la estación y el instante en que se registró cada valor. Si un valor
extremo se repite, se reporta su primera ocurrencia.

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

## Datos sintéticos

`prisma/seed/seed.sql` genera datos realistas para el clima andino de Caldas en octubre:

| Elemento | Cantidad |
|---|---|
| Municipios | 3: Manizales, Villamaría y Chinchiná (con su código DANE) |
| Estaciones | 5: 3 urbanas y 2 rurales |
| Mediciones | 100 lecturas por estación, cada una con las 5 variables (2.500 en total) |
| Periodo | 1 al 30 de octubre de 2026, una lectura cada 7 h 12 min |
| Alertas | 14 controladas, más 5 casos borde exactamente en el umbral (no alertan) |

El script es **determinista** (sin `random()`), **idempotente** y **transaccional**: cada
ejecución produce exactamente los mismos valores e ids, por lo que los resultados de la API son
verificables. `prisma/seed/verify.sql` muestra el resumen y la lista de alertas.

Detalle del modelo de cada variable y de las alertas esperadas:
[docs/synthetic-data.md](docs/synthetic-data.md).

## Modelo de datos

```mermaid
erDiagram
    MUNICIPALITIES ||--o{ STATIONS : "agrupa"
    STATIONS ||--o{ MEASUREMENTS : "registra"
    VARIABLES ||--o{ MEASUREMENTS : "clasifica"
```

| Tabla | Contenido |
|---|---|
| `municipalities` | Municipios (código DANE, nombre, departamento) |
| `stations` | Estaciones: código, tipo, coordenadas, altitud, estado y municipio |
| `variables` | Catálogo de variables con unidad y umbrales de alerta (`alert_min`, `alert_max`) |
| `measurements` | Mediciones en formato largo: una fila por estación, variable e instante |

Diagrama completo, restricciones de integridad e índices:
[docs/database-model.md](docs/database-model.md).

## Decisiones técnicas

- **Mediciones en formato largo.** Filtrar por variable, agregar y evaluar umbrales funciona
  igual para todas las variables. Agregar un nuevo indicador es insertar una fila en
  `variables`, sin cambiar el esquema.
- **Umbrales como datos, no como código.** Viven en la tabla `variables`, dentro de una
  migración (son datos de referencia del dominio, no sintéticos). La regla de alerta es
  genérica: `value > alert_max OR value < alert_min`.
- **Alertas calculadas al consultar.** No se guardan en otra tabla, así que no hay datos
  duplicados que puedan quedar inconsistentes si cambia un umbral.
- **Prisma en toda la capa de datos.** Las consultas de catálogos y mediciones usan la API
  de Prisma (`findMany`, `count`, `$transaction`). Los análisis usan SQL parametrizado a
  través de Prisma (`$queryRaw` con `Prisma.sql`), porque requieren capacidades que la API de
  alto nivel no expone: devolver la fila que originó un máximo o mínimo (funciones de ventana)
  y comparar cada valor con el umbral de su variable. Todos los valores viajan como parámetros
  enlazados, sin riesgo de inyección SQL.
- **Integridad en la base de datos.** Llaves foráneas con `ON DELETE RESTRICT` (no se pierde
  historial por accidente), una medición única por estación, variable e instante, y
  restricciones `CHECK` (código DANE, coordenadas, `alert_min < alert_max`).
- **Valores exactos.** `DECIMAL(8,2)` para valores y umbrales: `35.00` nunca se compara como
  `35.0000001`.
- **Fechas sin ambigüedad.** `TIMESTAMPTZ` en UTC. La fecha-hora de entrada exige zona
  horaria, y `YYYY-MM-DD` se interpreta en hora de Colombia.
- **Validación en capas.** DTOs con `class-validator` (formato), servicios con reglas de
  dominio (estación activa, rango físicamente posible, fecha no futura) y la base de datos como
  última barrera. Un filtro global traduce los errores de Prisma a respuestas HTTP coherentes.
- **Configuración validada al arrancar.** Si falta o es inválida una variable de entorno, la
  aplicación falla de inmediato con un mensaje claro.
- **Docker de producción.** Imagen multi-stage con solo dependencias de producción, usuario sin
  privilegios y `HEALTHCHECK`. La migración corre en un servicio separado antes de la API.

## Pruebas

```bash
npm test             # pruebas unitarias
npm run test:cov     # con reporte de cobertura
npm run test:e2e     # pruebas de extremo a extremo (requieren base de datos)
```

**Unitarias** (`src/**/*.spec.ts`): validadores de fechas, construcción de filtros y consultas
SQL, servicios de mediciones, análisis y salud, pipes y el script de inicialización.

**E2E** (`test/app.e2e-spec.ts`): levantan la aplicación completa y le hacen peticiones HTTP
reales. Verifican filtros, validaciones, códigos de error, el registro de mediciones y los
resultados exactos de los análisis sobre los datos sintéticos (por ejemplo, las 14 alertas).
Necesitan una base con solo los datos sintéticos; la de Docker Compose sirve:

```bash
docker compose up -d db migrate
DATABASE_URL="postgresql://sat_user:sat_password@localhost:5433/sat_environmental?schema=public" npm run test:e2e
```

En PowerShell, define la variable antes:
`$env:DATABASE_URL="postgresql://..."; npm run test:e2e`. Las pruebas que escriben datos los
revierten al terminar.

## Estructura del proyecto

```
├── prisma/
│   ├── schema.prisma            # modelo de datos
│   ├── migrations/              # migraciones (estructura + catálogo de variables y umbrales)
│   └── seed/                    # seed.sql (datos sintéticos) y verify.sql
├── src/
│   ├── analytics/               # promedios, extremos y alertas
│   ├── measurements/            # registro y consulta de mediciones
│   ├── stations/                # estaciones
│   ├── municipalities/          # municipios
│   ├── variables/               # variables, umbrales y límites físicos
│   ├── health/                  # estado del servicio
│   ├── common/                  # DTOs, validadores, pipes, filtros y utilidades compartidas
│   ├── config/                  # validación de entorno y Swagger
│   ├── prisma/                  # PrismaService
│   ├── scripts/db-init.ts       # migraciones + datos sintéticos (Docker y npm run db:init)
│   ├── app.module.ts
│   └── main.ts
├── test/                        # pruebas e2e
├── docs/                        # modelo de datos y datos sintéticos
├── Dockerfile
└── docker-compose.yml
```

Cada módulo sigue la misma organización: controlador (HTTP y documentación Swagger), servicio
(lógica de negocio), mapper (de modelo de Prisma a respuesta) y DTOs (validación y esquemas).

## Scripts y variables de entorno

| Script | Descripción |
|---|---|
| `npm run start:dev` | API en modo desarrollo (recarga automática) |
| `npm run build` / `npm run start:prod` | Compilar y ejecutar en producción |
| `npm run db:init` | Migraciones + datos sintéticos según `SEED_DATABASE` |
| `npm run db:migrate` | Solo aplica migraciones |
| `npm run db:seed` | Recarga los datos sintéticos |
| `npm run db:reset` | Borra y recrea la base (migraciones + datos) |
| `npm run lint` / `npm run format` | ESLint y Prettier |
| `npm run typecheck` | Chequeo de tipos de TypeScript |

| Variable | Por defecto | Descripción |
|---|---|---|
| `DATABASE_URL` | (obligatoria en local) | Cadena de conexión a PostgreSQL |
| `PORT` | `3000` | Puerto de la API |
| `NODE_ENV` | `development` | `development`, `production` o `test` |
| `SEED_DATABASE` | `if-empty` | Carga de datos sintéticos: `if-empty`, `always` o `never` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `sat_user` / `sat_password` / `sat_environmental` | Credenciales de la base en Docker Compose |
| `API_PORT` / `DB_PORT` | `3000` / `5433` | Puertos publicados por Docker Compose |
