-- CreateEnum
CREATE TYPE "station_type" AS ENUM ('URBAN', 'RURAL');

-- CreateEnum
CREATE TYPE "variable_code" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'PM25', 'PRECIPITATION', 'PH');

-- CreateTable
CREATE TABLE "municipalities" (
    "id" SERIAL NOT NULL,
    "dane_code" CHAR(5) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "station_type" NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "altitude_m" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "municipality_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables" (
    "id" SERIAL NOT NULL,
    "code" "variable_code" NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "alert_min" DECIMAL(8,2),
    "alert_max" DECIMAL(8,2),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "variable_id" INTEGER NOT NULL,
    "value" DECIMAL(8,2) NOT NULL,
    "measured_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_dane_code_key" ON "municipalities"("dane_code");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_name_department_key" ON "municipalities"("name", "department");

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_municipality_id_idx" ON "stations"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "variables_code_key" ON "variables"("code");

-- CreateIndex
CREATE INDEX "measurements_variable_id_measured_at_idx" ON "measurements"("variable_id", "measured_at");

-- CreateIndex
CREATE INDEX "measurements_measured_at_idx" ON "measurements"("measured_at");

-- CreateIndex
CREATE UNIQUE INDEX "measurements_station_id_variable_id_measured_at_key" ON "measurements"("station_id", "variable_id", "measured_at");

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Restricciones de integridad adicionales (Prisma no las expresa en el schema,
-- por eso se agregan manualmente a la migración).
-- ---------------------------------------------------------------------------

-- El código DANE de municipio son exactamente 5 dígitos.
ALTER TABLE "municipalities"
    ADD CONSTRAINT "municipalities_dane_code_format_chk" CHECK ("dane_code" ~ '^[0-9]{5}$');

-- Coordenadas geográficas válidas y altitud dentro de un rango físico razonable.
ALTER TABLE "stations"
    ADD CONSTRAINT "stations_latitude_range_chk" CHECK ("latitude" BETWEEN -90 AND 90),
    ADD CONSTRAINT "stations_longitude_range_chk" CHECK ("longitude" BETWEEN -180 AND 180),
    ADD CONSTRAINT "stations_altitude_range_chk" CHECK ("altitude_m" BETWEEN -500 AND 9000);

-- Si una variable define ambos umbrales, el mínimo debe ser menor que el máximo.
ALTER TABLE "variables"
    ADD CONSTRAINT "variables_alert_range_chk"
    CHECK ("alert_min" IS NULL OR "alert_max" IS NULL OR "alert_min" < "alert_max");

-- ---------------------------------------------------------------------------
-- Documentación del modelo en el propio catálogo de PostgreSQL.
-- ---------------------------------------------------------------------------
COMMENT ON TABLE "municipalities" IS 'Municipios donde se ubican las estaciones de monitoreo.';
COMMENT ON TABLE "stations" IS 'Estaciones de monitoreo ambiental.';
COMMENT ON TABLE "variables" IS 'Catálogo de variables ambientales y sus umbrales de alerta.';
COMMENT ON TABLE "measurements" IS 'Mediciones en formato largo: una fila por estación, variable e instante.';
COMMENT ON COLUMN "municipalities"."dane_code" IS 'Código DANE del municipio (5 dígitos).';
COMMENT ON COLUMN "stations"."altitude_m" IS 'Altitud en metros sobre el nivel del mar.';
COMMENT ON COLUMN "variables"."alert_min" IS 'Genera alerta si el valor es estrictamente menor. NULL = sin límite inferior.';
COMMENT ON COLUMN "variables"."alert_max" IS 'Genera alerta si el valor es estrictamente mayor. NULL = sin límite superior.';
COMMENT ON COLUMN "measurements"."measured_at" IS 'Instante de la medición, almacenado en UTC.';
