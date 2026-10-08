# Correcciones Fase 4.1 — Modelo lógico normalizado

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Objetivo:** aplicar las correcciones C-1 y C-2 de la auditoría para alcanzar **3FN completa**.
**Sin** SQL, `CREATE TABLE`, tipos de datos, índices, triggers ni procedimientos.

---

## 1. Cambios aplicados

### C-1 · MovimientoSaldo.clase_movimiento — ✅ aplicado
- **Problema:** `id_tipo_movimiento → clase_movimiento` duplicaba `TipoMovimientoSaldo.naturaleza` (dependencia parcial respecto de la CK).
- **Cambio:** se **eliminó `clase_movimiento`** de la tabla MovimientoSaldo. La clase (débito/crédito) se obtiene desde TipoMovimientoSaldo.

### C-2 · Resultado.opcion_ganadora — ✅ aplicado
- **Problema:** `(marcador_local, marcador_visitante) → opcion_ganadora` era una dependencia transitiva (ambos atributos no primos).
- **Cambio:** se **eliminó `opcion_ganadora`**. El **marcador es la fuente de verdad** y la opción ganadora (local/empate/visitante) se **deriva** al liquidar.

---

## 2. Estado de las tablas afectadas

| Tabla | Antes | Después | Estado |
|---|---|---|---|
| **T-23 MovimientoSaldo** | incluía `clase_movimiento` (redundante) | atributos: `id_movimiento`, `id_saldo_cuenta`, `id_tipo_movimiento`, `id_apuesta`, `id_recarga`, `monto`, `saldo_resultante`, `fecha_hora`, `referencia` | ✅ 2FN · 3FN |
| **T-26 Resultado** | incluía `opcion_ganadora` (transitiva) | atributos: `id_resultado`, `id_evento`, `marcador_local`, `marcador_visitante`, `fecha_registro`, `estado` | ✅ 3FN |
| **T-27 Liquidacion** | `monto_premio`, `resultado_liquidacion` | sin cambios (snapshots controlados) | ✅ 3FN |
| **T-22 SaldoCuenta** | `saldo_actual` | sin cambios (cache controlado) | ✅ 3FN |

---

## 3. Revisión de las 5 redundancias controladas

Son **derivaciones entre tablas** (no dependencias dentro de una misma tabla), por lo que **no violan 3FN**; se conservan por su valor operativo o histórico, con control transaccional.

| Tabla · Atributo | Justificación | Riesgo | Mecanismo de control | Decisión |
|---|---|---|---|---|
| T-17 OpcionApuesta · `cuota_vigente` | la cuota actual se lee constantemente (visualización y registro de apuestas) | divergir del último valor de HistorialCuota | cada cambio actualiza la cuota vigente **e** inserta una fila en HistorialCuota, en la misma transacción | **Mantener** |
| T-22 SaldoCuenta · `saldo_actual` | cache del saldo; base de la validación RN-08 | no coincidir con la suma de movimientos | el saldo solo se modifica dentro de la transacción que registra el movimiento | **Mantener** |
| T-23 MovimientoSaldo · `saldo_resultante` | snapshot del saldo tras el movimiento (auditoría) | inconsistencia con el saldo real | se calcula y escribe en la misma transacción del movimiento | **Mantener** |
| T-27 Liquidacion · `monto_premio` | snapshot del premio al momento de liquidar | divergir si cambia el criterio de cálculo | se calcula con la cuota congelada de la apuesta, en la transacción de liquidación | **Mantener** |
| T-27 Liquidacion · `resultado_liquidacion` | snapshot de la decisión (trazabilidad del cierre) | divergir si se recalculara con otro resultado | se escribe una sola vez y no se recalcula | **Mantener** |

**Confirmación:** las 5 se **mantienen**; ninguna se elimina. Quedan documentadas como redundancias controladas con su mecanismo de control.

---

## 4. Verificación final de formas normales

| Forma | Resultado | Observaciones |
|---|---|---|
| **1FN** | ✅ 29/29 | atributos atómicos; sin grupos repetitivos ni multivaluados |
| **2FN** | ✅ 29/29 | sin dependencias parciales (corregida la de MovimientoSaldo) |
| **3FN** | ✅ 29/29 | sin dependencias transitivas (corregida la de Resultado); 5 redundancias controladas documentadas |

---

## 5. Respuestas finales

1. **¿El modelo queda completamente normalizado?** **Sí:** 1FN, 2FN y 3FN en las 29 tablas.
2. **¿Las 29 tablas permanecen justificadas?** **Sí:** 25 imprescindibles + 4 de apoyo; ninguna fusión ni división necesaria.
3. **¿Listo para la Fase 5 — Diccionario de Datos?** **Sí.**
