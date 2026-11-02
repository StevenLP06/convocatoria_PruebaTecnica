-- =============================================================================
-- Datos sintéticos de prueba - SAT Environmental API
-- =============================================================================
--
-- Genera:
--   * 3 municipios de Caldas (Manizales, Villamaría, Chinchiná).
--   * 5 estaciones de monitoreo (3 urbanas, 2 rurales).
--   * 100 lecturas por estación, cada una con las 5 variables
--     (5 estaciones x 100 lecturas x 5 variables = 2.500 mediciones).
--   * Lecturas cada 7 h 12 min entre el 1 y el 30 de octubre de 2026
--     (hora de Colombia, UTC-05:00), es decir, distribuidas en 30 días.
--   * 14 alertas controladas y 5 casos borde exactamente en el umbral.
--
-- Características:
--   * Determinista: no usa random(). El "ruido" se obtiene de un hash (md5) de la
--     estación, la lectura y la variable, por lo que cada ejecución produce
--     exactamente los mismos valores. Esto hace verificables los resultados de la API.
--   * Idempotente: se puede ejecutar varias veces; actualiza municipios y estaciones
--     y regenera sus mediciones sin duplicar datos.
--   * Transaccional: si algo falla no queda ningún cambio a medias.
--
-- Requisito: haber aplicado las migraciones (incluyen el catálogo de variables).
--
-- Ejecución:
--   npm run db:seed
--   o bien: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/seed/seed.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Validar que existe el catálogo de variables (creado por las migraciones).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF (SELECT count(*) FROM "variables"
        WHERE "code" IN ('TEMPERATURE', 'HUMIDITY', 'PM25', 'PRECIPITATION', 'PH')) <> 5 THEN
        RAISE EXCEPTION 'No existe el catálogo de variables. Ejecuta primero las migraciones (npm run db:migrate).';
    END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 1. Funciones auxiliares temporales (solo existen durante esta sesión).
-- -----------------------------------------------------------------------------

-- Número pseudoaleatorio uniforme en [0, 1) derivado de una semilla de texto.
CREATE FUNCTION pg_temp.seeded_random(seed TEXT)
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE
AS $$
    SELECT ('x' || substr(md5(seed), 1, 8))::BIT(32)::BIGINT / 4294967296.0;
$$;

-- Ruido centrado en 0, en el rango (-1.5, 1.5), con forma aproximadamente normal
-- (suma de tres uniformes): los valores extremos son poco frecuentes.
CREATE FUNCTION pg_temp.seeded_noise(seed TEXT)
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE
AS $$
    SELECT pg_temp.seeded_random(seed || ':a')
         + pg_temp.seeded_random(seed || ':b')
         + pg_temp.seeded_random(seed || ':c')
         - 1.5;
$$;

-- -----------------------------------------------------------------------------
-- 2. Municipios (códigos DANE oficiales).
-- -----------------------------------------------------------------------------
INSERT INTO "municipalities" ("dane_code", "name", "department") VALUES
    ('17001', 'Manizales',  'Caldas'),
    ('17873', 'Villamaría', 'Caldas'),
    ('17174', 'Chinchiná',  'Caldas')
ON CONFLICT ("dane_code") DO UPDATE
    SET "name"       = EXCLUDED."name",
        "department" = EXCLUDED."department",
        "updated_at" = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 3. Estaciones (coordenadas y altitudes aproximadas, con fines de prueba).
-- -----------------------------------------------------------------------------
INSERT INTO "stations" ("code", "name", "type", "latitude", "longitude", "altitude_m", "municipality_id")
SELECT s.code, s.name, s.type::"station_type", s.latitude, s.longitude, s.altitude_m, m."id"
FROM (VALUES
    (1, 'MZL-01', 'Manizales - Centro',     'URBAN', 5.068440, -75.517320, 2150, '17001'),
    (2, 'MZL-02', 'Manizales - La Nubia',   'URBAN', 5.030000, -75.465000, 2080, '17001'),
    (3, 'MZL-03', 'Manizales - Río Blanco', 'RURAL', 5.074000, -75.438000, 2550, '17001'),
    (4, 'VLM-01', 'Villamaría - Centro',    'URBAN', 5.044700, -75.514900, 1920, '17873'),
    (5, 'CHN-01', 'Chinchiná - Rural',      'RURAL', 4.983000, -75.603700, 1360, '17174')
) AS s(sort_order, code, name, type, latitude, longitude, altitude_m, dane_code)
JOIN "municipalities" m ON m."dane_code" = s.dane_code
-- El orden explícito garantiza ids predecibles en una base nueva (MZL-01 = 1 ... CHN-01 = 5).
ORDER BY s.sort_order
ON CONFLICT ("code") DO UPDATE
    SET "name"            = EXCLUDED."name",
        "type"            = EXCLUDED."type",
        "latitude"        = EXCLUDED."latitude",
        "longitude"       = EXCLUDED."longitude",
        "altitude_m"      = EXCLUDED."altitude_m",
        "municipality_id" = EXCLUDED."municipality_id",
        "is_active"       = TRUE,
        "updated_at"      = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 4. Regenerar las mediciones de las estaciones de prueba (idempotencia).
-- -----------------------------------------------------------------------------
DELETE FROM "measurements"
WHERE "station_id" IN (
    SELECT "id" FROM "stations" WHERE "code" IN ('MZL-01', 'MZL-02', 'MZL-03', 'VLM-01', 'CHN-01')
);

-- -----------------------------------------------------------------------------
-- 5. Mediciones.
--
-- Modelo de cada variable (valores coherentes con el clima andino de Caldas en
-- octubre, temporada de lluvias):
--   * Temperatura: media según la altitud (~6 °C menos por cada 1.000 m) y ciclo
--     diario con máximo hacia las 15:00 y mínimo en la madrugada; baja si llueve.
--   * Humedad: inversa a la temperatura, más alta con lluvia y en zona rural;
--     se satura suavemente por debajo de 94.5 % (sin alertas espontáneas).
--   * Precipitación: lluvia acumulada en el intervalo. Llueve en ~45-58 % de las
--     lecturas con distribución exponencial (media ~5.7 mm), tope de 48 mm.
--   * PM2.5: nivel de fondo + picos de tráfico (7:00 y 18:00) en zona urbana;
--     la lluvia lava el aire (-40 %). Tope de 23.5 µg/m³.
--   * pH del agua: ligeramente básico (~7.0-7.5), baja levemente con la lluvia.
--
-- Los escenarios de la sección "scenarios" sobrescriben valores puntuales para
-- producir alertas conocidas y casos borde.
-- -----------------------------------------------------------------------------
WITH station_params (station_code, temp_mean, temp_amplitude, humidity_base,
                     pm25_base, pm25_traffic, rain_probability, ph_base) AS (
    VALUES
        ('MZL-01', 16.5, 4.5, 80.0, 13.0, 7.0, 0.50, 7.30),
        ('MZL-02', 16.9, 4.5, 79.0, 11.0, 6.0, 0.48, 7.20),
        ('MZL-03', 14.2, 5.0, 86.0,  6.0, 1.0, 0.58, 6.90),
        ('VLM-01', 17.9, 5.0, 78.0, 10.0, 5.0, 0.47, 7.40),
        ('CHN-01', 21.1, 5.5, 76.0,  8.0, 2.0, 0.44, 7.50)
),

-- Escenarios controlados: alertas esperadas y casos borde (valor = umbral, NO es alerta).
-- reading_index va de 0 a 99; la hora local de cada índice se indica en el comentario.
scenarios (station_code, reading_index, variable_code, value) AS (
    VALUES
        -- Ola de calor en Chinchiná ---------------------------- ALERTAS TEMPERATURA (2)
        ('CHN-01', 42, 'TEMPERATURE',   35.6),  -- 2026-10-13 14:24
        ('CHN-01', 42, 'HUMIDITY',      52.0),
        ('CHN-01', 42, 'PRECIPITATION',  0.0),
        ('CHN-01', 45, 'TEMPERATURE',   36.2),  -- 2026-10-14 12:00
        ('CHN-01', 45, 'HUMIDITY',      49.5),
        ('CHN-01', 45, 'PRECIPITATION',  0.0),

        -- Niebla densa nocturna -------------------------------- ALERTAS HUMEDAD (3)
        ('MZL-03', 17, 'HUMIDITY',      96.8),  -- 2026-10-06 02:24
        ('MZL-03', 63, 'HUMIDITY',      97.4),  -- 2026-10-19 21:36
        ('MZL-01', 80, 'HUMIDITY',      95.6),  -- 2026-10-25 00:00

        -- Caída de ceniza del Volcán Nevado del Ruiz + tráfico - ALERTAS PM2.5 (4)
        ('MZL-01', 21, 'PM25',          31.4),  -- 2026-10-07 07:12
        ('MZL-02', 21, 'PM25',          27.9),  -- 2026-10-07 07:12
        ('VLM-01', 21, 'PM25',          26.3),  -- 2026-10-07 07:12
        ('MZL-01', 56, 'PM25',          28.1),  -- 2026-10-17 19:12 (hora pico)

        -- Tormenta del 22 de octubre ---------------------------- ALERTAS PRECIPITACIÓN (3)
        ('MZL-03', 73, 'PRECIPITATION', 62.5),  -- 2026-10-22 21:36
        ('MZL-03', 73, 'HUMIDITY',      94.2),
        ('MZL-01', 73, 'PRECIPITATION', 54.8),
        ('MZL-01', 73, 'HUMIDITY',      93.6),
        ('VLM-01', 73, 'PRECIPITATION', 51.2),
        ('VLM-01', 73, 'HUMIDITY',      93.1),
        ('MZL-02', 73, 'PRECIPITATION', 38.0),  -- lluvia fuerte, pero bajo el umbral
        ('MZL-02', 73, 'HUMIDITY',      92.7),

        -- Calidad del agua --------------------------------------- ALERTAS pH (2)
        ('MZL-03', 74, 'PH',             5.62), -- 2026-10-23 04:48 (escorrentía ácida tras la tormenta)
        ('CHN-01', 88, 'PH',             9.31), -- 2026-10-27 09:36 (vertimiento alcalino)

        -- Casos borde: valor EXACTAMENTE en el umbral (la condición es estricta: NO alertan)
        ('CHN-01', 95, 'TEMPERATURE',   35.0),  -- 2026-10-29 12:00
        ('MZL-03', 27, 'HUMIDITY',      95.0),  -- 2026-10-09 02:24
        ('MZL-02', 30, 'PM25',          25.0),  -- 2026-10-10 00:00
        ('VLM-01', 33, 'PRECIPITATION', 50.0),  -- 2026-10-10 21:36
        ('VLM-01', 33, 'HUMIDITY',      93.0),
        ('MZL-03', 50, 'PH',             6.00)  -- 2026-10-16 00:00
),

readings AS (
    SELECT
        s."id" AS station_id,
        p.*,
        r.reading_index,
        r.measured_at,
        p.station_code || ':' || r.reading_index AS seed,
        EXTRACT(HOUR   FROM r.measured_at AT TIME ZONE 'America/Bogota')
          + EXTRACT(MINUTE FROM r.measured_at AT TIME ZONE 'America/Bogota') / 60.0 AS local_hour
    FROM station_params p
    JOIN "stations" s ON s."code" = p.station_code
    CROSS JOIN LATERAL (
        SELECT gs AS reading_index,
               TIMESTAMPTZ '2026-10-01 00:00:00-05:00' + gs * INTERVAL '7 hours 12 minutes' AS measured_at
        FROM generate_series(0, 99) AS gs
    ) r
),

weather AS (
    SELECT
        rd.*,
        pg_temp.seeded_random(rd.seed || ':rain') < rd.rain_probability AS is_raining
    FROM readings rd
),

computed AS (
    SELECT
        w.station_id,
        w.station_code,
        w.reading_index,
        w.measured_at,
        w.is_raining,
        -- Temperatura (°C)
        w.temp_mean
          + w.temp_amplitude * sin(2 * pi() * (w.local_hour - 9) / 24)
          + 0.8 * pg_temp.seeded_noise(w.seed || ':temp')
          - CASE WHEN w.is_raining THEN 1.5 ELSE 0 END AS temperature,
        -- Precipitación (mm)
        CASE WHEN w.is_raining
             THEN least(48.0, 0.2 - 5.5 * ln(1 - pg_temp.seeded_random(w.seed || ':rain_amount')))
             ELSE 0
        END AS precipitation,
        -- PM2.5 (µg/m³)
        greatest(3.0, least(23.5,
            (w.pm25_base
              + w.pm25_traffic * (exp(-power(w.local_hour - 7, 2) / 4) + exp(-power(w.local_hour - 18, 2) / 4))
              + 2.5 * pg_temp.seeded_noise(w.seed || ':pm25'))
            * CASE WHEN w.is_raining THEN 0.6 ELSE 1 END
        )) AS pm25,
        -- pH del agua
        greatest(6.30, least(8.70,
            w.ph_base
              + 0.25 * pg_temp.seeded_noise(w.seed || ':ph')
              - CASE WHEN w.is_raining THEN 0.15 ELSE 0 END
        )) AS ph,
        w.temp_mean,
        w.humidity_base,
        w.seed
    FROM weather w
),

with_humidity AS (
    SELECT
        c.*,
        -- Humedad (%): saturación suave con asíntota en 94.5 % y piso de 45 %.
        greatest(45.0,
            CASE WHEN h.raw > 90 THEN 90 + 4.5 * (1 - exp(-(h.raw - 90) / 5.0)) ELSE h.raw END
        ) AS humidity
    FROM computed c
    CROSS JOIN LATERAL (
        SELECT c.humidity_base
                 - 2.0 * (c.temperature - c.temp_mean)
                 + CASE WHEN c.is_raining THEN 7 ELSE 0 END
                 + 3.0 * pg_temp.seeded_noise(c.seed || ':humidity') AS raw
    ) h
)

INSERT INTO "measurements" ("station_id", "variable_id", "value", "measured_at")
SELECT
    wh.station_id,
    v."id",
    round(coalesce(sc.value, val.value)::NUMERIC, CASE WHEN val.code = 'PH' THEN 2 ELSE 1 END),
    wh.measured_at
FROM with_humidity wh
CROSS JOIN LATERAL (
    VALUES
        ('TEMPERATURE',   wh.temperature),
        ('HUMIDITY',      wh.humidity),
        ('PM25',          wh.pm25),
        ('PRECIPITATION', wh.precipitation),
        ('PH',            wh.ph)
) AS val(code, value)
JOIN "variables" v ON v."code" = val.code::"variable_code"
LEFT JOIN scenarios sc
       ON sc.station_code  = wh.station_code
      AND sc.reading_index = wh.reading_index
      AND sc.variable_code = val.code
ORDER BY wh.measured_at, wh.station_code, v."id";

COMMIT;
