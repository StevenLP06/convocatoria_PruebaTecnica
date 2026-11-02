-- =============================================================================
-- Verificación de los datos sintéticos (solo lectura).
--
--   psql "$DATABASE_URL" -f prisma/seed/verify.sql
--
-- Resultado esperado: 3 municipios, 5 estaciones, 2.500 mediciones
-- (500 por estación, 100 lecturas) y exactamente 14 alertas.
-- =============================================================================

\echo '== Resumen general'
SELECT
    (SELECT count(*) FROM "municipalities") AS municipios,
    (SELECT count(*) FROM "stations")       AS estaciones,
    (SELECT count(*) FROM "variables")      AS variables,
    (SELECT count(*) FROM "measurements")   AS mediciones;

\echo '== Mediciones por estación'
SELECT
    s."code"                                                           AS estacion,
    mu."name"                                                          AS municipio,
    count(*)                                                           AS mediciones,
    count(DISTINCT m."measured_at")                                    AS lecturas,
    min(m."measured_at" AT TIME ZONE 'America/Bogota')                 AS desde_hora_local,
    max(m."measured_at" AT TIME ZONE 'America/Bogota')                 AS hasta_hora_local
FROM "measurements" m
JOIN "stations" s        ON s."id" = m."station_id"
JOIN "municipalities" mu ON mu."id" = s."municipality_id"
GROUP BY s."code", mu."name"
ORDER BY s."code";

\echo '== Promedio, mínimo y máximo por variable'
SELECT
    v."code"                 AS variable,
    v."unit"                 AS unidad,
    round(avg(m."value"), 2) AS promedio,
    min(m."value")           AS minimo,
    max(m."value")           AS maximo
FROM "measurements" m
JOIN "variables" v ON v."id" = m."variable_id"
GROUP BY v."id", v."code", v."unit"
ORDER BY v."id";

\echo '== Alertas (mediciones que superan los umbrales)'
SELECT
    s."code"                                                                  AS estacion,
    v."code"                                                                  AS variable,
    m."value"                                                                 AS valor,
    CASE WHEN m."value" > v."alert_max" THEN '> ' || v."alert_max"
         ELSE '< ' || v."alert_min" END                                       AS umbral_superado,
    to_char(m."measured_at" AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD HH24:MI') AS hora_local
FROM "measurements" m
JOIN "stations" s  ON s."id" = m."station_id"
JOIN "variables" v ON v."id" = m."variable_id"
WHERE m."value" > v."alert_max" OR m."value" < v."alert_min"
ORDER BY v."id", m."measured_at", s."code";
