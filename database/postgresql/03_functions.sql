-- ============================================================================
-- APUESTADB - database/postgresql/03_functions.sql
-- Escrituras financieras transaccionales en PostgreSQL (Fase 16.1).
--
-- Reglas preservadas (SQL Server -> PostgreSQL):
--   * monto > 0 (RN-03), origen excluyente apuesta/recarga.
--   * TOKENS y PSE son cuentas independientes.
--   * saldo_resultante = saldo +/- monto; saldo nunca negativo (RN-04).
--   * bloqueo de fila con SELECT ... FOR UPDATE (concurrencia).
--   * idempotencia por clave: un duplicado no aplica cambios dos veces.
--   * cualquier fallo revierte la transaccion completa (rollback).
-- ============================================================================

-- Bloquea y devuelve la clave de idempotencia dentro de la transaccion.
CREATE OR REPLACE FUNCTION fn_movimiento_saldo(
  p_id_saldo_cuenta  INTEGER,
  p_nombre_movimiento VARCHAR,
  p_monto            NUMERIC,
  p_id_apuesta       INTEGER DEFAULT NULL,
  p_id_recarga       INTEGER DEFAULT NULL,
  p_referencia       VARCHAR DEFAULT NULL,
  p_clave_idempotencia VARCHAR DEFAULT NULL
) RETURNS TABLE (id_movimiento BIGINT, saldo_resultante NUMERIC, idempotente BOOLEAN) AS $$
DECLARE
  v_tipo        INTEGER;
  v_naturaleza  VARCHAR(10);
  v_saldo       NUMERIC(18,2);
  v_nuevo       NUMERIC(18,2);
  v_id          BIGINT;
  v_existente   BIGINT;
  v_saldo_prev  NUMERIC(18,2);
BEGIN
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'MONTO_INVALIDO';
  END IF;
  IF p_id_apuesta IS NOT NULL AND p_id_recarga IS NOT NULL THEN
    RAISE EXCEPTION 'ORIGEN_EXCLUYENTE';
  END IF;

  IF p_clave_idempotencia IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_clave_idempotencia));
    SELECT i.id_movimiento, m.saldo_resultante
      INTO v_existente, v_saldo_prev
      FROM IdempotenciaFinanciera i
      JOIN MovimientoSaldo m ON m.id_movimiento = i.id_movimiento
     WHERE i.clave = p_clave_idempotencia;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, v_saldo_prev, TRUE;
      RETURN;
    END IF;
  END IF;

  SELECT id_tipo_movimiento, naturaleza
    INTO v_tipo, v_naturaleza
    FROM TipoMovimientoSaldo
   WHERE nombre = p_nombre_movimiento;
  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'TIPO_MOVIMIENTO_INVALIDO';
  END IF;

  SELECT sc.saldo_actual INTO v_saldo
    FROM SaldoCuenta sc
   WHERE sc.id_saldo_cuenta = p_id_saldo_cuenta
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CUENTA_NO_ENCONTRADA';
  END IF;

  v_nuevo := CASE WHEN v_naturaleza = 'debito'
                  THEN v_saldo - p_monto
                  ELSE v_saldo + p_monto END;
  IF v_nuevo < 0 THEN
    RAISE EXCEPTION 'SALDO_INSUFICIENTE';
  END IF;

  UPDATE SaldoCuenta
     SET saldo_actual = v_nuevo,
         fecha_ultima_actualizacion = CURRENT_TIMESTAMP
   WHERE id_saldo_cuenta = p_id_saldo_cuenta;

  INSERT INTO MovimientoSaldo
    (id_saldo_cuenta, id_tipo_movimiento, id_apuesta, id_recarga, monto,
     saldo_resultante, fecha_hora, referencia)
  VALUES
    (p_id_saldo_cuenta, v_tipo, p_id_apuesta, p_id_recarga, p_monto,
     v_nuevo, CURRENT_TIMESTAMP, p_referencia)
  RETURNING MovimientoSaldo.id_movimiento INTO v_id;

  IF p_clave_idempotencia IS NOT NULL THEN
    INSERT INTO IdempotenciaFinanciera (clave, id_movimiento)
    VALUES (p_clave_idempotencia, v_id);
  END IF;

  RETURN QUERY SELECT v_id, v_nuevo, FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_recarga_crear(
  p_id_usuario      INTEGER,
  p_id_tipo_saldo   INTEGER,
  p_monto           NUMERIC,
  p_id_administrador INTEGER DEFAULT NULL,
  p_observacion     VARCHAR DEFAULT NULL,
  p_clave_idempotencia VARCHAR DEFAULT NULL
) RETURNS TABLE (id_recarga INTEGER, mensaje VARCHAR, idempotente BOOLEAN) AS $$
DECLARE
  v_tipo_vigente INTEGER;
  v_id_cuenta    INTEGER;
  v_id_recarga   INTEGER;
  v_existente    INTEGER;
BEGIN
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'MONTO_INVALIDO';
  END IF;

  IF p_clave_idempotencia IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_clave_idempotencia));
    SELECT i.id_recarga INTO v_existente
      FROM IdempotenciaFinanciera i
     WHERE i.clave = p_clave_idempotencia
       AND i.id_recarga IS NOT NULL;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, 'Recarga aplicada correctamente.'::varchar, TRUE;
      RETURN;
    END IF;
  END IF;

  SELECT id_tipo_saldo INTO v_tipo_vigente
    FROM TipoSaldo
   WHERE id_tipo_saldo = p_id_tipo_saldo AND estado = 'vigente';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TIPO_SALDO_INVALIDO';
  END IF;

  SELECT id_saldo_cuenta INTO v_id_cuenta
    FROM SaldoCuenta
   WHERE id_usuario = p_id_usuario AND id_tipo_saldo = p_id_tipo_saldo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CUENTA_NO_ENCONTRADA';
  END IF;

  INSERT INTO Recarga (id_usuario, id_tipo_saldo, monto, estado, observacion)
  VALUES (p_id_usuario, p_id_tipo_saldo, p_monto, 'aplicada', p_observacion)
  RETURNING Recarga.id_recarga INTO v_id_recarga;

  PERFORM fn_movimiento_saldo(
    v_id_cuenta, 'recarga', p_monto, NULL, v_id_recarga,
    'Recarga de saldo ficticio',
    CASE WHEN p_clave_idempotencia IS NULL THEN NULL
         ELSE p_clave_idempotencia || ':mov' END
  );

  IF p_clave_idempotencia IS NOT NULL THEN
    INSERT INTO IdempotenciaFinanciera (clave, id_recarga)
    VALUES (p_clave_idempotencia, v_id_recarga);
  END IF;

  RETURN QUERY SELECT v_id_recarga, 'Recarga aplicada correctamente.'::varchar, FALSE;
END;
$$ LANGUAGE plpgsql;
