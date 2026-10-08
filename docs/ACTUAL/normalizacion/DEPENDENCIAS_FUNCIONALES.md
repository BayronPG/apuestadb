# Dependencias funcionales — ApuestaDB (Auditoría · Fase 4)

**Nivel:** lógico. **Sin** SQL ni tipos de datos. Solo auditoría (no se modifica el modelo).
> Notación: **X → Y** = X determina funcionalmente a Y. Se analiza respecto a **todas las claves candidatas**, no solo a la clave primaria.
> `PK` = clave primaria · `CK` = clave candidata · *primo* = atributo que pertenece a alguna clave candidata.

---

## 1. Resumen por tabla

| Tabla | Claves | Dependencias principales | ¿Parcial? | ¿Transitiva? |
|---|---|---|---|---|
| T-01 Rol | PK id_rol · CK nombre | id_rol → (nombre, descripcion, estado); nombre → (id_rol, descripcion, estado) | No | No |
| T-02 Usuario | PK id_usuario · CK correo | id_usuario → resto; correo → resto | No | No |
| T-03 PreguntaSeguridad | PK id_pregunta · CK enunciado | id_pregunta → resto; enunciado → resto | No | No |
| T-04 RespuestaSeguridad | PK id_respuesta · CK (id_usuario, id_pregunta) | (id_usuario, id_pregunta) → (respuesta, fecha_registro) | No | No |
| T-05 TokenRecuperacion | PK id_token · CK valor_token | valor_token → resto | No | No |
| T-06 Pais | PK id_pais · CK nombre, codigo | nombre → resto; codigo → resto | No | No |
| T-07 Ciudad | PK id_ciudad · CK (id_pais, nombre) | (id_pais, nombre) → (region) | No | No |
| T-08 Estadio | PK id_estadio · CK (id_ciudad, nombre) | (id_ciudad, nombre) → (capacidad, direccion) | No | No |
| T-09 Deporte | PK id_deporte · CK nombre | nombre → resto | No | No |
| T-10 Liga | PK id_liga · CK (id_deporte, nombre) | (id_deporte, nombre) → (categoria, estado) | No | No |
| T-11 Temporada | PK id_temporada · CK (id_liga, etiqueta) | (id_liga, etiqueta) → (fecha_inicio, fecha_fin, estado) | No | No |
| T-12 Equipo | PK id_equipo · CK (id_deporte, nombre) | (id_deporte, nombre) → (id_ciudad, siglas, fecha_fundacion, estado) | No | No |
| T-13 Arbitro | PK id_arbitro · CK (nombres, apellidos)¹ | (nombres, apellidos) → resto | No | No |
| T-14 Evento | PK id_evento · CK (id_temporada, id_equipo_local, id_equipo_visitante, fecha_hora_inicio) | CK → (id_estadio, estado, descripcion) | No | No |
| T-15 CalendarioArbitro | PK id_calendario · CK (id_evento, id_arbitro) | (id_evento, id_arbitro) → (rol_arbitro, fecha_designacion) | No | No |
| T-16 Mercado | PK id_mercado · CK (id_evento, nombre) | (id_evento, nombre) → (descripcion, fecha_apertura, fecha_cierre, estado) | No | No |
| T-17 OpcionApuesta | PK id_opcion · CK (id_mercado, etiqueta) | (id_mercado, etiqueta) → (cuota_vigente, estado) | No | No (redundancia controlada: cuota_vigente) |
| T-18 HistorialCuota | PK id_historial · CK (id_opcion, fecha_hora_cambio) | (id_opcion, fecha_hora_cambio) → (valor_cuota, motivo) | No | No |
| T-19 Apuesta | PK id_apuesta · CK (id_usuario, id_opcion, fecha_hora_registro) | CK → (id_tipo_saldo, monto, cuota_congelada, tipo_apuesta, estado) | No | No |
| T-20 FavoritoEquipo | PK id_favorito · CK (id_usuario, id_equipo) | (id_usuario, id_equipo) → (fecha_marcado) | No | No |
| T-21 TipoSaldo | PK id_tipo_saldo · CK nombre | nombre → resto | No | No |
| T-22 SaldoCuenta | PK id_saldo_cuenta · CK (id_usuario, id_tipo_saldo) | (id_usuario, id_tipo_saldo) → (saldo_actual, fecha_ultima_actualizacion) | No | No (agregado controlado: saldo_actual) |
| T-23 MovimientoSaldo | PK id_movimiento · CK (id_saldo_cuenta, fecha_hora, id_tipo_movimiento) | CK → (id_apuesta, id_recarga, monto, saldo_resultante, referencia) | No | No (snapshot controlado: saldo_resultante) |
| T-24 TipoMovimientoSaldo | PK id_tipo_movimiento · CK nombre | nombre → resto | No | No |
| T-25 Recarga | PK id_recarga · CK (id_usuario, id_tipo_saldo, fecha_hora) | CK → (monto, estado, observacion) | No | No |
| T-26 Resultado | PK id_resultado · CK id_evento | id_evento → (marcador_local, marcador_visitante, fecha_registro, estado) | No | No (corregido en Fase 4.1) |
| T-27 Liquidacion | PK id_liquidacion · CK id_apuesta | id_apuesta → (id_resultado, resultado_liquidacion, monto_premio, fecha_hora, estado) | No | No (snapshots controlados) |
| T-28 Notificacion | PK id_notificacion | id_notificacion → resto | No | No |
| T-29 Auditoria | PK id_auditoria | id_auditoria → resto | No | No |

¹ `(nombres, apellidos)` es cuasi-candidata; podría no ser única en la realidad → a validar.
² A partir de la Fase 4.1, las derivaciones **entre tablas** se tratan como redundancias controladas (no violan 3FN); las únicas dependencias **dentro de una tabla** se corrigieron (ver `CORRECCIONES_4_1.md`).

---

## 2. Análisis de las dependencias señaladas

### ² OpcionApuesta.cuota_vigente
- **FD observada:** `id_mercado, etiqueta → cuota_vigente`, pero además `cuota_vigente` = último `valor_cuota` de **HistorialCuota** para esa opción.
- **Tipo:** redundancia **entre tablas** (la cuota vigente es derivable del historial).
- **Naturaleza:** *snapshot controlado* (valor de lectura frecuente). No rompe 2FN; afecta la pureza de 3FN si no se documenta.

### ³ SaldoCuenta.saldo_actual
- **FD observada:** `(id_usuario, id_tipo_saldo) → saldo_actual`, y `saldo_actual = saldo_inicial + Σ(movimientos)`.
- **Tipo:** agregado mantenido (redundancia derivable de MovimientoSaldo).
- **Naturaleza:** *cache de saldo* imprescindible para el rendimiento y las validaciones (RN-08). Justificado si se actualiza en la misma transacción.

### ⁴ MovimientoSaldo — corregido (Fase 4.1)
- **`clase_movimiento`:** eliminado en la Fase 4.1 (duplicaba TipoMovimientoSaldo.naturaleza).
- **`saldo_resultante`:** snapshot controlado (no dependencia dentro de la tabla).

### ⁵ Resultado.opcion_ganadora — corregido (Fase 4.1)
- **FD detectada (Fase 4):** `(marcador_local, marcador_visitante) → opcion_ganadora` (transitiva). **Corregido:** se eliminó `opcion_ganadora`; el marcador es la fuente de verdad.

### ⁶ Liquidacion
- **`monto_premio`:** derivable de `Apuesta.monto × Apuesta.cuota_congelada` → valor derivado (cruce de tablas).
- **`resultado_liquidacion`:** derivable de comparar la opción apostada con la opción ganadora → valor derivado (cruce de tablas).
- **Naturaleza:** *snapshots históricos* del cierre (no dependencias transitivas dentro de la tabla).

---

## 3. Conclusión del análisis de dependencias

- **Tras las correcciones de la Fase 4.1, ninguna tabla presenta dependencias parciales** (todas las CK compuestas determinan completas a sus atributos no primos).
- **Tras las correcciones, quedan 4 tablas con valores derivados controlados:** OpcionApuesta, SaldoCuenta, MovimientoSaldo y Liquidacion (Resultado quedó corregido).
- Son **derivaciones entre tablas** (no violan 3FN) y se documentan como redundancias controladas.
