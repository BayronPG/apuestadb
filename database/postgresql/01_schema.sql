-- ============================================================================
-- APUESTADB - database/postgresql/01_schema.sql
-- Esquema PostgreSQL del dominio financiero (Fase 16).
--
-- 5 tablas: TipoSaldo, TipoMovimientoSaldo, SaldoCuenta, Recarga, MovimientoSaldo.
-- Referencias externas (sin FK entre motores):
--   * SaldoCuenta.id_usuario   -> Usuario (SQL Server)
--   * Recarga.id_usuario       -> Usuario (SQL Server)
--   * MovimientoSaldo.id_apuesta -> Apuesta (MongoDB)
--
-- Idempotente: CREATE TABLE IF NOT EXISTS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS TipoSaldo (
  id_tipo_saldo SERIAL PRIMARY KEY,
  nombre        VARCHAR(20) NOT NULL,
  descripcion   VARCHAR(255) NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'vigente'
);

CREATE TABLE IF NOT EXISTS TipoMovimientoSaldo (
  id_tipo_movimiento SERIAL PRIMARY KEY,
  nombre             VARCHAR(20) NOT NULL,
  naturaleza         VARCHAR(10) NOT NULL,
  descripcion        VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS SaldoCuenta (
  id_saldo_cuenta            SERIAL PRIMARY KEY,
  id_usuario                 INTEGER NOT NULL,
  id_tipo_saldo              INTEGER NOT NULL REFERENCES TipoSaldo (id_tipo_saldo),
  saldo_actual               NUMERIC(18,2) NOT NULL DEFAULT 0,
  fecha_ultima_actualizacion TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Recarga (
  id_recarga    SERIAL PRIMARY KEY,
  id_usuario    INTEGER NOT NULL,
  id_tipo_saldo INTEGER NOT NULL REFERENCES TipoSaldo (id_tipo_saldo),
  monto         NUMERIC(18,2) NOT NULL,
  fecha_hora    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado        VARCHAR(20) NOT NULL DEFAULT 'aplicada',
  observacion   VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS MovimientoSaldo (
  id_movimiento      BIGSERIAL PRIMARY KEY,
  id_saldo_cuenta    INTEGER NOT NULL REFERENCES SaldoCuenta (id_saldo_cuenta),
  id_tipo_movimiento INTEGER NOT NULL REFERENCES TipoMovimientoSaldo (id_tipo_movimiento),
  id_apuesta         INTEGER NULL,
  id_recarga         INTEGER NULL REFERENCES Recarga (id_recarga),
  monto              NUMERIC(18,2) NOT NULL,
  saldo_resultante   NUMERIC(18,2) NOT NULL,
  fecha_hora         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  referencia         VARCHAR(100) NULL
);

-- ------------------------------------------------------------------ vistas --
CREATE OR REPLACE VIEW vw_SaldoDetalle AS
SELECT sc.id_saldo_cuenta,
       sc.id_usuario,
       sc.id_tipo_saldo,
       ts.nombre AS tipo_saldo,
       sc.saldo_actual,
       sc.fecha_ultima_actualizacion
  FROM SaldoCuenta sc
  JOIN TipoSaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo;

CREATE OR REPLACE VIEW vw_HistorialMovimientos AS
SELECT ms.id_movimiento,
       sc.id_usuario,
       ts.nombre AS tipo_saldo,
       tm.nombre AS concepto,
       tm.naturaleza,
       ms.monto,
       ms.saldo_resultante,
       ms.fecha_hora,
       ms.referencia,
       ms.id_apuesta,
       ms.id_recarga
  FROM MovimientoSaldo ms
  JOIN SaldoCuenta sc           ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
  JOIN TipoSaldo ts             ON ts.id_tipo_saldo = sc.id_tipo_saldo
  JOIN TipoMovimientoSaldo tm   ON tm.id_tipo_movimiento = ms.id_tipo_movimiento;
