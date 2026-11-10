-- ============================================================================
-- APUESTADB - database/postgresql/06_pagos_wompi.sql
-- Tabla de pagos Wompi (Sandbox/Produccion). Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS PagoWompi (
  id_pago          BIGSERIAL PRIMARY KEY,
  referencia       VARCHAR(120) NOT NULL UNIQUE,
  id_usuario       INTEGER NOT NULL,
  id_tipo_saldo    INTEGER NOT NULL,
  monto_centavos   BIGINT NOT NULL CHECK (monto_centavos > 0),
  moneda           VARCHAR(3) NOT NULL DEFAULT 'COP',
  estado           VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  transaction_id   VARCHAR(100) NULL,
  evento_id        VARCHAR(120) NULL UNIQUE,
  payload_hash     VARCHAR(64) NULL,
  creado           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT CK_PagoWompi_estado CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO','ANULADO'))
);

CREATE INDEX IF NOT EXISTS IX_PagoWompi_Usuario ON PagoWompi (id_usuario);
CREATE INDEX IF NOT EXISTS IX_PagoWompi_Estado  ON PagoWompi (estado);
