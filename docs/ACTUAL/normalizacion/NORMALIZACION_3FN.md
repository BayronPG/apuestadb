# Normalización — Tercera Forma Normal (3FN)

**Modelo:** lógico relacional de 29 tablas · **Fase 4 (auditoría)** · Sin SQL ni tipos de datos.
> **Definición (3FN):** una relación está en 3FN si está en 2FN y **ningún atributo no primo depende transitivamente de la clave** (es decir, no hay atributos no primos determinados por otros atributos no primos).
> Además se distingue entre **dependencias transitivas** (errores) y **redundancias controladas** (valores derivados que se conservan a propósito).

---

## 1. Verificación por tabla

| # | Tabla | ¿Dependencia transitiva? | Veredicto |
|---|---|---|---|
| T-01 | Rol | No | ✅ 3FN |
| T-02 | Usuario | No | ✅ 3FN |
| T-03 | PreguntaSeguridad | No | ✅ 3FN |
| T-04 | RespuestaSeguridad | No | ✅ 3FN |
| T-05 | TokenRecuperacion | No | ✅ 3FN |
| T-06 | Pais | No | ✅ 3FN |
| T-07 | Ciudad | No | ✅ 3FN |
| T-08 | Estadio | No | ✅ 3FN |
| T-09 | Deporte | No | ✅ 3FN |
| T-10 | Liga | No | ✅ 3FN |
| T-11 | Temporada | No | ✅ 3FN |
| T-12 | Equipo | No | ✅ 3FN |
| T-13 | Arbitro | No | ✅ 3FN |
| T-14 | Evento | No | ✅ 3FN |
| T-15 | CalendarioArbitro | No | ✅ 3FN |
| T-16 | Mercado | No | ✅ 3FN |
| T-17 | OpcionApuesta | Redundancia controlada (`cuota_vigente`) | ⚠️ 3FN con nota |
| T-18 | HistorialCuota | No | ✅ 3FN |
| T-19 | Apuesta | No | ✅ 3FN |
| T-20 | FavoritoEquipo | No | ✅ 3FN |
| T-21 | TipoSaldo | No | ✅ 3FN |
| T-22 | SaldoCuenta | Redundancia controlada (`saldo_actual`) | ⚠️ 3FN con nota |
| T-23 | MovimientoSaldo | Redundancia controlada (`saldo_resultante`) | ✅ 3FN con nota |
| T-24 | TipoMovimientoSaldo | No | ✅ 3FN |
| T-25 | Recarga | No | ✅ 3FN |
| T-26 | Resultado | No | ✅ 3FN |
| T-27 | Liquidacion | Redundancias controladas (`monto_premio`, `resultado_liquidacion`) | ⚠️ 3FN con nota |
| T-28 | Notificacion | No | ✅ 3FN |
| T-29 | Auditoria | No | ✅ 3FN |

---

## 2. Correcciones aplicadas (Fase 4.1)

### 2.1 Resultado.opcion_ganadora — ✅ RESUELTO
- **Problema (Fase 4):** `marcador_local, marcador_visitante → opcion_ganadora` (transitiva; ambos no primos).
- **Corrección (C-2):** se **eliminó `opcion_ganadora`**; el marcador es la fuente de verdad y la opción ganadora se **deriva** al liquidar.
- **Resultado:** Resultado queda en 3FN.

### 2.2 MovimientoSaldo.clase_movimiento — ✅ RESUELTO
- **Problema (Fase 4):** `id_tipo_movimiento → clase_movimiento` (duplicaba `TipoMovimientoSaldo.naturaleza`).
- **Corrección (C-1):** se **eliminó `clase_movimiento`**; la clase se obtiene de TipoMovimientoSaldo.
- **Resultado:** MovimientoSaldo queda en 2FN y 3FN.

---

## 3. Redundancias controladas (se conservan a propósito)

Son **derivaciones entre tablas**: dentro de cada tabla el valor depende de su propia clave, por lo que **no violan 3FN**. Se conservan por valor operativo o histórico, con control transaccional.

| Tabla · Atributo | Justificación | Riesgo | Mecanismo de control | Decisión |
|---|---|---|---|---|
| T-17 OpcionApuesta · `cuota_vigente` | la cuota actual se lee constantemente | divergir del último valor del historial | cada cambio actualiza la cuota vigente e inserta una fila en HistorialCuota, en la misma transacción | **Mantener** |
| T-22 SaldoCuenta · `saldo_actual` | cache del saldo; base de la validación RN-08 | no coincidir con la suma de movimientos | el saldo solo se modifica en la transacción del movimiento | **Mantener** |
| T-23 MovimientoSaldo · `saldo_resultante` | snapshot del saldo tras el movimiento | inconsistencia con el saldo real | se calcula y escribe en la misma transacción del movimiento | **Mantener** |
| T-27 Liquidacion · `monto_premio` | snapshot del premio al liquidar | divergir si cambia el criterio de cálculo | se calcula con la cuota congelada, en la transacción de liquidación | **Mantener** |
| T-27 Liquidacion · `resultado_liquidacion` | snapshot de la decisión (trazabilidad) | divergir si se recalculara | se escribe una vez, en la transacción de liquidación; no se recalcula | **Mantener** |

---

## 4. Veredicto 3FN

- **Las 29 tablas cumplen la 3FN.**
- Las 2 dependencias detectadas en la Fase 4 (Resultado, MovimientoSaldo) quedaron **corregidas en la Fase 4.1**.
- Las **5 redundancias controladas** se mantienen documentadas y no violan 3FN (son derivaciones entre tablas).
