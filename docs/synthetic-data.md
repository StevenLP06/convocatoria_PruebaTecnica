# Datos sintéticos

El script [`prisma/seed/seed.sql`](../prisma/seed/seed.sql) genera un conjunto de datos de
prueba realista para el clima andino de Caldas en octubre (temporada de lluvias).

## Cómo cargarlos

```bash
npm run db:setup     # aplica migraciones + carga los datos
# o por separado:
npm run db:migrate
npm run db:seed
```

También se puede ejecutar directamente con `psql`:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/seed/seed.sql
psql "$DATABASE_URL" -f prisma/seed/verify.sql   # resumen y lista de alertas
```

## Propiedades del script

| Propiedad | Cómo se logra |
|---|---|
| **Determinista** | No usa `random()`: el ruido sale de un hash `md5` de estación + lectura + variable. Cada ejecución produce exactamente los mismos valores, así los resultados de la API son verificables. |
| **Idempotente** | Municipios y estaciones se insertan con `ON CONFLICT ... DO UPDATE` y las mediciones de las estaciones de prueba se regeneran. Se puede ejecutar varias veces sin duplicar datos. |
| **Transaccional** | Todo corre en una sola transacción: si algo falla, no queda nada a medias. |
| **Fail-fast** | Si no se aplicaron las migraciones (falta el catálogo de variables), aborta con un mensaje claro. |

## Volumen

| Elemento | Cantidad |
|---|---|
| Municipios | 3 (Manizales, Villamaría, Chinchiná — con su código DANE) |
| Estaciones | 5 (3 urbanas, 2 rurales) |
| Lecturas por estación | 100, cada una con las 5 variables |
| Mediciones totales | 2.500 (5 × 100 × 5) |
| Periodo | 1 al 30 de octubre de 2026, una lectura cada 7 h 12 min (hora de Colombia) |

### Estaciones

| Código | Nombre | Municipio | Tipo | Altitud (m) |
|---|---|---|---|---|
| `MZL-01` | Manizales - Centro | Manizales | Urbana | 2150 |
| `MZL-02` | Manizales - La Nubia | Manizales | Urbana | 2080 |
| `MZL-03` | Manizales - Río Blanco | Manizales | Rural | 2550 |
| `VLM-01` | Villamaría - Centro | Villamaría | Urbana | 1920 |
| `CHN-01` | Chinchiná - Rural | Chinchiná | Rural | 1360 |

Las coordenadas y altitudes son aproximadas, con fines de prueba.

## Modelo de cada variable

| Variable | Comportamiento simulado | Rango típico resultante |
|---|---|---|
| Temperatura | Media según la altitud (~6 °C menos por cada 1.000 m) y ciclo diario con máximo hacia las 15:00. Baja si llueve. | 7–27 °C (Chinchiná es la más cálida) |
| Humedad relativa | Inversa a la temperatura, más alta con lluvia y en zona rural. Se satura suavemente por debajo de 94.5 %. | 62–94 % |
| Precipitación | Llueve en ~45–60 % de las lecturas, cantidad con distribución exponencial. Acumulado mensual de 265–445 mm según la estación. | 0–35 mm por lectura |
| PM2.5 | Fondo + picos de tráfico a las 7:00 y 18:00 en zona urbana. La lluvia lava el aire. | 3–20 µg/m³ |
| pH del agua | Ligeramente básico, baja un poco con la lluvia. | 6.5–7.8 |

Los modelos base están acotados para que **nunca** generen alertas por sí solos: todas las
alertas provienen de los escenarios controlados de la siguiente sección.

## Alertas esperadas (14)

| Escenario | Estación | Variable | Valor | Hora local |
|---|---|---|---|---|
| Ola de calor | `CHN-01` | Temperatura | 35.6 °C | 2026-10-13 14:24 |
| Ola de calor | `CHN-01` | Temperatura | 36.2 °C | 2026-10-14 12:00 |
| Niebla densa | `MZL-03` | Humedad | 96.8 % | 2026-10-06 02:24 |
| Niebla densa | `MZL-03` | Humedad | 97.4 % | 2026-10-19 21:36 |
| Niebla densa | `MZL-01` | Humedad | 95.6 % | 2026-10-25 00:00 |
| Ceniza del Nevado del Ruiz | `MZL-01` | PM2.5 | 31.4 µg/m³ | 2026-10-07 07:12 |
| Ceniza del Nevado del Ruiz | `MZL-02` | PM2.5 | 27.9 µg/m³ | 2026-10-07 07:12 |
| Ceniza del Nevado del Ruiz | `VLM-01` | PM2.5 | 26.3 µg/m³ | 2026-10-07 07:12 |
| Tráfico en hora pico | `MZL-01` | PM2.5 | 28.1 µg/m³ | 2026-10-17 19:12 |
| Tormenta | `MZL-03` | Precipitación | 62.5 mm | 2026-10-22 21:36 |
| Tormenta | `MZL-01` | Precipitación | 54.8 mm | 2026-10-22 21:36 |
| Tormenta | `VLM-01` | Precipitación | 51.2 mm | 2026-10-22 21:36 |
| Escorrentía ácida tras la tormenta | `MZL-03` | pH | 5.62 | 2026-10-23 04:48 |
| Vertimiento alcalino | `CHN-01` | pH | 9.31 | 2026-10-27 09:36 |

En la misma tormenta, `MZL-02` registra 38.0 mm: lluvia fuerte pero **bajo** el umbral.

## Casos borde (5, no generan alerta)

Las condiciones de alerta son estrictas ("mayor a" / "menor a"), por lo que un valor
exactamente igual al umbral **no** es alerta. Estos casos permiten probarlo:

| Estación | Variable | Valor | Hora local |
|---|---|---|---|
| `CHN-01` | Temperatura | 35.0 °C | 2026-10-29 12:00 |
| `MZL-03` | Humedad | 95.0 % | 2026-10-09 02:24 |
| `MZL-02` | PM2.5 | 25.0 µg/m³ | 2026-10-10 00:00 |
| `VLM-01` | Precipitación | 50.0 mm | 2026-10-10 21:36 |
| `MZL-03` | pH | 6.00 | 2026-10-16 00:00 |
