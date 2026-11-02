-- Catálogo de variables ambientales y umbrales de alerta definidos en la prueba técnica.
--
-- Son datos de referencia del dominio (no datos sintéticos), por eso viven en una
-- migración: cualquier base de datos migrada tendrá siempre las variables y sus
-- umbrales, se carguen o no las mediciones de prueba.
--
--   Variable       | Condición de alerta
--   ---------------|------------------------
--   Temperatura    | Mayor a 35 °C
--   Humedad        | Mayor a 95 %
--   PM2.5          | Mayor a 25 µg/m³
--   Precipitación  | Mayor a 50 mm
--   pH             | Menor a 6 o mayor a 9

INSERT INTO "variables" ("code", "name", "unit", "alert_min", "alert_max") VALUES
    ('TEMPERATURE',   'Temperatura ambiental',      '°C',    NULL, 35.00),
    ('HUMIDITY',      'Humedad relativa',           '%',     NULL, 95.00),
    ('PM25',          'Material particulado PM2.5', 'µg/m³', NULL, 25.00),
    ('PRECIPITATION', 'Precipitación',              'mm',    NULL, 50.00),
    ('PH',            'Calidad del agua (pH)',      'pH',    6.00, 9.00);
