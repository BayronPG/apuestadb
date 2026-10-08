# Normalización — Segunda Forma Normal (2FN)

**Modelo:** lógico relacional de 29 tablas · **Fase 4 (auditoría)** · Sin SQL ni tipos de datos.
> **Definición (2FN):** una relación está en 2FN si está en 1FN y **todo atributo no primo depende funcionalmente de la clave completa**, es decir, **no existen dependencias parciales** respecto de ninguna clave candidata.
> En este modelo, la 2FN solo puede fallar en tablas con **clave candidata compuesta**.

---

## 1. Tablas con clave candidata compuesta (donde aplica el análisis)

| Tabla | Clave candidata compuesta | Atributos no primos | ¿Depende de parte de la clave? | Veredicto |
|---|---|---|---|---|
| T-04 RespuestaSeguridad | (id_usuario, id_pregunta) | respuesta, fecha_registro | No | ✅ 2FN |
| T-07 Ciudad | (id_pais, nombre) | region | No | ✅ 2FN |
| T-08 Estadio | (id_ciudad, nombre) | capacidad, direccion | No | ✅ 2FN |
| T-10 Liga | (id_deporte, nombre) | categoria, estado | No | ✅ 2FN |
| T-11 Temporada | (id_liga, etiqueta) | fecha_inicio, fecha_fin, estado | No | ✅ 2FN |
| T-12 Equipo | (id_deporte, nombre) | id_ciudad, siglas, fecha_fundacion, estado | No | ✅ 2FN |
| T-13 Arbitro | (nombres, apellidos) | categoria, estado | No | ✅ 2FN |
| T-14 Evento | (id_temporada, id_equipo_local, id_equipo_visitante, fecha_hora_inicio) | id_estadio, estado, descripcion | No | ✅ 2FN |
| T-15 CalendarioArbitro | (id_evento, id_arbitro) | rol_arbitro, fecha_designacion | No | ✅ 2FN |
| T-16 Mercado | (id_evento, nombre) | descripcion, fecha_apertura, fecha_cierre, estado | No | ✅ 2FN |
| T-17 OpcionApuesta | (id_mercado, etiqueta) | cuota_vigente, estado | No | ✅ 2FN |
| T-18 HistorialCuota | (id_opcion, fecha_hora_cambio) | valor_cuota, motivo | No | ✅ 2FN |
| T-19 Apuesta | (id_usuario, id_opcion, fecha_hora_registro) | id_tipo_saldo, monto, cuota_congelada, tipo_apuesta, estado | No | ✅ 2FN |
| T-20 FavoritoEquipo | (id_usuario, id_equipo) | fecha_marcado | No | ✅ 2FN |
| T-22 SaldoCuenta | (id_usuario, id_tipo_saldo) | saldo_actual, fecha_ultima_actualizacion | No | ✅ 2FN |
| T-23 MovimientoSaldo | (id_saldo_cuenta, fecha_hora, id_tipo_movimiento) | id_apuesta, id_recarga, monto, saldo_resultante, referencia | No | ✅ 2FN |
| T-25 Recarga | (id_usuario, id_tipo_saldo, fecha_hora) | monto, estado, observacion | No | ✅ 2FN |

## 2. Tablas con clave simple

Las 12 tablas restantes (Rol, Usuario, PreguntaSeguridad, TokenRecuperacion, Pais, Deporte, TipoSaldo, TipoMovimientoSaldo, Resultado, Liquidacion, Notificacion, Auditoria) tienen PK de un solo atributo, por lo que **no pueden presentar dependencias parciales**: están automáticamente en 2FN (dado que cumplen 1FN).

---

## 3. Hallazgo: `MovimientoSaldo.clase_movimiento` — ✅ RESUELTO en Fase 4.1

- **Dependencia observada:** `id_tipo_movimiento → clase_movimiento`. Es decir, dado el tipo de movimiento, su clase (débito/crédito) queda fija.
- **Problema:** `id_tipo_movimiento` es **parte de la clave candidata** compuesta `(id_saldo_cuenta, fecha_hora, id_tipo_movimiento)`. Por tanto, `clase_movimiento` depende de **una parte** de la clave → **dependencia parcial** → incumple 2FN.
- **Origen del dato:** `clase_movimiento` **duplica** `TipoMovimientoSaldo.naturaleza`.
- **Impacto:** riesgo de inconsistencia (una clase y una naturaleza que se contradigan) y espacio repetido.
- **Cambio aplicado (Fase 4.1):** **se eliminó `clase_movimiento`** de MovimientoSaldo; la clase se obtiene desde TipoMovimientoSaldo. Con ello la tabla cumple 2FN.

> Nota de rigor: si la CK de MovimientoSaldo se ajustara a `(id_saldo_cuenta, fecha_hora)`, `id_tipo_movimiento` deja de ser primo y `clase_movimiento` pasaría a ser una dependencia **transitiva** (se trataría entonces en 3FN). En ambos escenarios, **la solución es la misma: eliminar `clase_movimiento`.**

---

## 4. Veredicto 2FN

**Las 29 tablas cumplen la 2FN.** La observación de `MovimientoSaldo` quedó corregida en la Fase 4.1 al eliminar `clase_movimiento`.
