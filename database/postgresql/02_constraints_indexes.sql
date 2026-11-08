-- ============================================================================
-- APUESTADB - database/postgresql/02_constraints_indexes.sql
-- UNIQUE, CHECK e indices del dominio financiero (Fase 16).
-- Idempotente: cada objeto se agrega solo si no existe en pg_catalog.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('UQ_TipoSaldo_nombre')) THEN
    ALTER TABLE TipoSaldo ADD CONSTRAINT UQ_TipoSaldo_nombre UNIQUE (nombre);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('UQ_TipoMovimientoSaldo_nombre')) THEN
    ALTER TABLE TipoMovimientoSaldo ADD CONSTRAINT UQ_TipoMovimientoSaldo_nombre UNIQUE (nombre);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('UQ_SaldoCuenta')) THEN
    ALTER TABLE SaldoCuenta ADD CONSTRAINT UQ_SaldoCuenta UNIQUE (id_usuario, id_tipo_saldo);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('UQ_Recarga')) THEN
    ALTER TABLE Recarga ADD CONSTRAINT UQ_Recarga UNIQUE (id_usuario, id_tipo_saldo, fecha_hora);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_TipoSaldo_nombre')) THEN
    ALTER TABLE TipoSaldo ADD CONSTRAINT CK_TipoSaldo_nombre CHECK (nombre IN ('tokens','PSE'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_TipoSaldo_estado')) THEN
    ALTER TABLE TipoSaldo ADD CONSTRAINT CK_TipoSaldo_estado CHECK (estado IN ('vigente','inactivo'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_SaldoCuenta_saldo')) THEN
    ALTER TABLE SaldoCuenta ADD CONSTRAINT CK_SaldoCuenta_saldo CHECK (saldo_actual >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_TipoMovimientoSaldo_nombre')) THEN
    ALTER TABLE TipoMovimientoSaldo ADD CONSTRAINT CK_TipoMovimientoSaldo_nombre
      CHECK (nombre IN ('apuesta','premio','recarga','ajuste'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_TipoMovimientoSaldo_naturaleza')) THEN
    ALTER TABLE TipoMovimientoSaldo ADD CONSTRAINT CK_TipoMovimientoSaldo_naturaleza
      CHECK (naturaleza IN ('debito','credito'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_MovimientoSaldo_monto')) THEN
    ALTER TABLE MovimientoSaldo ADD CONSTRAINT CK_MovimientoSaldo_monto CHECK (monto > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_MovimientoSaldo_saldo')) THEN
    ALTER TABLE MovimientoSaldo ADD CONSTRAINT CK_MovimientoSaldo_saldo CHECK (saldo_resultante >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_MovimientoSaldo_origen')) THEN
    ALTER TABLE MovimientoSaldo ADD CONSTRAINT CK_MovimientoSaldo_origen
      CHECK (id_apuesta IS NULL OR id_recarga IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_Recarga_monto')) THEN
    ALTER TABLE Recarga ADD CONSTRAINT CK_Recarga_monto CHECK (monto > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE lower(conname) = lower('CK_Recarga_estado')) THEN
    ALTER TABLE Recarga ADD CONSTRAINT CK_Recarga_estado CHECK (estado IN ('aplicada','anulada'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS IX_SaldoCuenta_Usuario     ON SaldoCuenta (id_usuario);
CREATE INDEX IF NOT EXISTS IX_SaldoCuenta_Tipo        ON SaldoCuenta (id_tipo_saldo);
CREATE INDEX IF NOT EXISTS IX_Movimiento_Cuenta       ON MovimientoSaldo (id_saldo_cuenta);
CREATE INDEX IF NOT EXISTS IX_Movimiento_Tipo         ON MovimientoSaldo (id_tipo_movimiento);
CREATE INDEX IF NOT EXISTS IX_Movimiento_Fecha        ON MovimientoSaldo (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS IX_Movimiento_Apuesta      ON MovimientoSaldo (id_apuesta);
CREATE INDEX IF NOT EXISTS IX_Recarga_Usuario         ON Recarga (id_usuario);
CREATE INDEX IF NOT EXISTS IX_Recarga_Tipo            ON Recarga (id_tipo_saldo);
