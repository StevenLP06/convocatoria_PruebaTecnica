import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Ruta de la interfaz de Swagger UI (el JSON queda en `${SWAGGER_PATH}-json`). */
export const SWAGGER_PATH = 'api/docs';

export const API_TAGS = {
  municipalities: 'Municipios',
  stations: 'Estaciones',
  variables: 'Variables',
  measurements: 'Mediciones',
  analytics: 'Análisis',
} as const;

const API_DESCRIPTION = `
API REST para almacenar, consultar y analizar mediciones ambientales provenientes de
estaciones de monitoreo (SAT).

### Filtros de fecha
\`startDate\` y \`endDate\` aceptan:
- \`YYYY-MM-DD\`: día completo en hora de Colombia (UTC-05:00).
- Fecha-hora ISO 8601 con zona horaria, p. ej. \`2026-10-05T08:00:00-05:00\`.

Ambos extremos son inclusivos. Las fechas de las respuestas se expresan en UTC.

### Umbrales de alerta
Una medición genera alerta si su valor es **estrictamente** mayor que el umbral máximo
o menor que el mínimo de su variable (un valor igual al umbral no es alerta).

| Variable | Código | Condición de alerta |
|---|---|---|
| Temperatura | \`TEMPERATURE\` | Mayor a 35 °C |
| Humedad relativa | \`HUMIDITY\` | Mayor a 95 % |
| PM2.5 | \`PM25\` | Mayor a 25 µg/m³ |
| Precipitación | \`PRECIPITATION\` | Mayor a 50 mm |
| pH del agua | \`PH\` | Menor a 6 o mayor a 9 |

### Errores
Todas las respuestas de error tienen la forma \`{ statusCode, error, message }\`.
`;

/**
 * Publica la documentación OpenAPI:
 *   - Swagger UI en /api/docs
 *   - Especificación JSON en /api/docs-json
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SAT Environmental API')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0.0')
    .addTag(API_TAGS.municipalities, 'Municipios donde se ubican las estaciones')
    .addTag(API_TAGS.stations, 'Estaciones de monitoreo ambiental')
    .addTag(API_TAGS.variables, 'Variables ambientales, unidades y umbrales de alerta')
    .addTag(API_TAGS.measurements, 'Registro y consulta de mediciones')
    .addTag(API_TAGS.analytics, 'Promedios, máximos y mínimos, y alertas')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'SAT Environmental API - Documentación',
    swaggerOptions: {
      displayRequestDuration: true,
      docExpansion: 'list',
      tryItOutEnabled: true,
    },
  });
}
