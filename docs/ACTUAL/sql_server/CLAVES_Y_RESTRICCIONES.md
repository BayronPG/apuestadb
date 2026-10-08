# Claves y restricciones — ApuestaDB (SQL Server · Fase 6)

**Base:** modelo físico (Fases 1–5). Diseño, sin script SQL.
> Convención de nombres: `PK_<Tabla>`, `FK_<Tabla>_<Referencia>`, `UQ_<Tabla>_<Columnas>`, `CK_<Tabla>_<Regla>`, `DF_<Tabla>_<Columna>`.

---

## 1. Claves primarias

| Tabla | PK | Tipo | Índice |
|---|---|---|---|
| Todas las 29 tablas | `id_<entidad>` | `INT IDENTITY(1,1)` (BIGINT en HistorialCuota, MovimientoSaldo, Notificacion, Auditoria) | **CLUSTERED** |

Todas las PK son **sustitutas, secuenciales y no nulas**, lo que favorece inserciones ordenadas.

## 2. Claves foráneas y acciones referenciales

Se usa **`NO ACTION` por defecto** (protege los datos transaccionales). Solo se permite **`CASCADE`** en dependientes "hoja" sin hijos propios. **`ON UPDATE = NO ACTION` en todas** (las PK sustitutas no cambian).

| # | FK | Referencia | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| FK_Usuario_Rol | Usuario.id_rol | Rol(id_rol) | NO ACTION | NO ACTION |
| FK_RespuestaSeguridad_Usuario | RespuestaSeguridad.id_usuario | Usuario(id_usuario) | **CASCADE** | NO ACTION |
| FK_RespuestaSeguridad_Pregunta | RespuestaSeguridad.id_pregunta | PreguntaSeguridad(id_pregunta) | NO ACTION | NO ACTION |
| FK_TokenRecuperacion_Usuario | TokenRecuperacion.id_usuario | Usuario(id_usuario) | **CASCADE** | NO ACTION |
| FK_Ciudad_Pais | Ciudad.id_pais | Pais(id_pais) | NO ACTION | NO ACTION |
| FK_Estadio_Ciudad | Estadio.id_ciudad | Ciudad(id_ciudad) | NO ACTION | NO ACTION |
| FK_Equipo_Deporte | Equipo.id_deporte | Deporte(id_deporte) | NO ACTION | NO ACTION |
| FK_Equipo_Ciudad | Equipo.id_ciudad | Ciudad(id_ciudad) | NO ACTION | NO ACTION |
| FK_Liga_Deporte | Liga.id_deporte | Deporte(id_deporte) | NO ACTION | NO ACTION |
| FK_Temporada_Liga | Temporada.id_liga | Liga(id_liga) | NO ACTION | NO ACTION |
| FK_Evento_Temporada | Evento.id_temporada | Temporada(id_temporada) | NO ACTION | NO ACTION |
| FK_Evento_EquipoLocal | Evento.id_equipo_local | Equipo(id_equipo) | NO ACTION | NO ACTION |
| FK_Evento_EquipoVisitante | Evento.id_equipo_visitante | Equipo(id_equipo) | NO ACTION | NO ACTION |
| FK_Evento_Estadio | Evento.id_estadio | Estadio(id_estadio) | NO ACTION | NO ACTION |
| FK_CalendarioArbitro_Evento | CalendarioArbitro.id_evento | Evento(id_evento) | **CASCADE** | NO ACTION |
| FK_CalendarioArbitro_Arbitro | CalendarioArbitro.id_arbitro | Arbitro(id_arbitro) | NO ACTION | NO ACTION |
| FK_Mercado_Evento | Mercado.id_evento | Evento(id_evento) | NO ACTION | NO ACTION |
| FK_OpcionApuesta_Mercado | OpcionApuesta.id_mercado | Mercado(id_mercado) | NO ACTION | NO ACTION |
| FK_HistorialCuota_Opcion | HistorialCuota.id_opcion | OpcionApuesta(id_opcion) | **CASCADE** | NO ACTION |
| FK_Apuesta_Usuario | Apuesta.id_usuario | Usuario(id_usuario) | NO ACTION | NO ACTION |
| FK_Apuesta_Opcion | Apuesta.id_opcion | OpcionApuesta(id_opcion) | NO ACTION | NO ACTION |
| FK_Apuesta_TipoSaldo | Apuesta.id_tipo_saldo | TipoSaldo(id_tipo_saldo) | NO ACTION | NO ACTION |
| **FK_Apuesta_SaldoCuenta** | Apuesta(id_usuario, id_tipo_saldo) | SaldoCuenta(id_usuario, id_tipo_saldo) | NO ACTION | NO ACTION |
| FK_FavoritoEquipo_Usuario | FavoritoEquipo.id_usuario | Usuario(id_usuario) | **CASCADE** | NO ACTION |
| FK_FavoritoEquipo_Equipo | FavoritoEquipo.id_equipo | Equipo(id_equipo) | **CASCADE** | NO ACTION |
| FK_SaldoCuenta_Usuario | SaldoCuenta.id_usuario | Usuario(id_usuario) | NO ACTION | NO ACTION |
| FK_SaldoCuenta_TipoSaldo | SaldoCuenta.id_tipo_saldo | TipoSaldo(id_tipo_saldo) | NO ACTION | NO ACTION |
| FK_MovimientoSaldo_SaldoCuenta | MovimientoSaldo.id_saldo_cuenta | SaldoCuenta(id_saldo_cuenta) | NO ACTION | NO ACTION |
| FK_MovimientoSaldo_TipoMovimiento | MovimientoSaldo.id_tipo_movimiento | TipoMovimientoSaldo(id_tipo_movimiento) | NO ACTION | NO ACTION |
| FK_MovimientoSaldo_Apuesta | MovimientoSaldo.id_apuesta | Apuesta(id_apuesta) | NO ACTION | NO ACTION |
| FK_MovimientoSaldo_Recarga | MovimientoSaldo.id_recarga | Recarga(id_recarga) | NO ACTION | NO ACTION |
| FK_Recarga_Usuario | Recarga.id_usuario | Usuario(id_usuario) | NO ACTION | NO ACTION |
| FK_Recarga_TipoSaldo | Recarga.id_tipo_saldo | TipoSaldo(id_tipo_saldo) | NO ACTION | NO ACTION |
| FK_Resultado_Evento | Resultado.id_evento | Evento(id_evento) | NO ACTION | NO ACTION |
| FK_Liquidacion_Apuesta | Liquidacion.id_apuesta | Apuesta(id_apuesta) | NO ACTION | NO ACTION |
| FK_Liquidacion_Resultado | Liquidacion.id_resultado | Resultado(id_resultado) | NO ACTION | NO ACTION |
| FK_Notificacion_Usuario | Notificacion.id_usuario | Usuario(id_usuario) | **CASCADE** | NO ACTION |
| FK_Auditoria_Usuario | Auditoria.id_usuario | Usuario(id_usuario) | NO ACTION | NO ACTION |

**Criterio:** las `CASCADE` solo se aplican a filas que **no tienen existencia propia** fuera de su padre (respuestas, tokens, favoritos, notificaciones, historial de cuota, designaciones). Ningún dato **financiero** (Apuesta, SaldoCuenta, MovimientoSaldo, Liquidacion) usa `CASCADE`.

## 3. Restricciones UNIQUE (claves candidatas)

| # | Tabla | Columnas únicas |
|---|---|---|
| UQ_Rol | Rol | nombre |
| UQ_Usuario_correo | Usuario | correo |
| UQ_Usuario_telefono (filtrado) | Usuario | telefono WHERE telefono IS NOT NULL |
| UQ_PreguntaSeguridad | PreguntaSeguridad | enunciado |
| UQ_RespuestaSeguridad | RespuestaSeguridad | (id_usuario, id_pregunta) |
| UQ_TokenRecuperacion | TokenRecuperacion | valor_token |
| UQ_Pais_nombre | Pais | nombre |
| UQ_Pais_codigo | Pais | codigo |
| UQ_Ciudad | Ciudad | (id_pais, nombre) |
| UQ_Estadio | Estadio | (id_ciudad, nombre) |
| UQ_Deporte | Deporte | nombre |
| UQ_Liga | Liga | (id_deporte, nombre) |
| UQ_Temporada | Temporada | (id_liga, etiqueta) |
| UQ_Equipo | Equipo | (id_deporte, nombre) |
| UQ_Evento | Evento | (id_temporada, id_equipo_local, id_equipo_visitante, fecha_hora_inicio) |
| UQ_CalendarioArbitro | CalendarioArbitro | (id_evento, id_arbitro) |
| UQ_Mercado | Mercado | (id_evento, nombre) |
| UQ_OpcionApuesta | OpcionApuesta | (id_mercado, etiqueta) |
| UQ_HistorialCuota | HistorialCuota | (id_opcion, fecha_hora_cambio) |
| UQ_Apuesta | Apuesta | (id_usuario, id_opcion, fecha_hora_registro) |
| UQ_FavoritoEquipo | FavoritoEquipo | (id_usuario, id_equipo) |
| UQ_TipoSaldo | TipoSaldo | nombre |
| UQ_SaldoCuenta | SaldoCuenta | (id_usuario, id_tipo_saldo) |
| UQ_TipoMovimientoSaldo | TipoMovimientoSaldo | nombre |
| UQ_Recarga | Recarga | (id_usuario, id_tipo_saldo, fecha_hora) |
| UQ_Resultado | Resultado | id_evento |
| UQ_Liquidacion | Liquidacion | id_apuesta |

**Notas:** `UQ_Resultado` y `UQ_Liquidacion` materializan las relaciones **1:1**. `UQ_RespuestaSeguridad`, `UQ_CalendarioArbitro`, `UQ_FavoritoEquipo`, `UQ_SaldoCuenta` materializan las **N:M**.

## 4. Restricciones CHECK

### Dominios enumerados
| Restricción | Tabla · columna | Valores permitidos |
|---|---|---|
| CK_Rol_nombre | Rol.nombre | usuario, administrador |
| CK_Rol_estado · CK_Deporte_estado · CK_Liga_estado · CK_Equipo_estado · CK_Arbitro_estado · CK_TipoSaldo_estado · CK_PreguntaSeguridad_estado | estado | vigente, inactivo |
| CK_Usuario_estado | Usuario.estado | activo, inhabilitado |
| CK_Token_estado | TokenRecuperacion.estado | vigente, usado, expirado |
| CK_Temporada_estado | Temporada.estado | en_curso, finalizada |
| CK_Evento_estado | Evento.estado | programado, en_curso, finalizado, cancelado, suspendido |
| CK_CalendarioArbitro_rol | CalendarioArbitro.rol_arbitro | principal, asistente |
| CK_Mercado_estado | Mercado.estado | abierto, cerrado, anulado |
| CK_OpcionApuesta_etiqueta | OpcionApuesta.etiqueta | local, empate, visitante |
| CK_OpcionApuesta_estado | OpcionApuesta.estado | habilitada, deshabilitada |
| CK_Apuesta_tipo | Apuesta.tipo_apuesta | simple |
| CK_Apuesta_estado | Apuesta.estado | pendiente, ganada, perdida, anulada |
| CK_TipoSaldo_nombre | TipoSaldo.nombre | tokens, PSE |
| CK_TipoMovimiento_nombre | TipoMovimientoSaldo.nombre | apuesta, premio, recarga, ajuste |
| CK_TipoMovimiento_naturaleza | TipoMovimientoSaldo.naturaleza | debito, credito |
| CK_Recarga_estado | Recarga.estado | aplicada, anulada |
| CK_Resultado_estado | Resultado.estado | oficial, provisional |
| CK_Liquidacion_resultado | Liquidacion.resultado_liquidacion | ganada, perdida, anulada |
| CK_Liquidacion_estado | Liquidacion.estado | aplicada, revertida |
| CK_Notificacion_estado | Notificacion.estado | no_leida, leida |
| CK_Auditoria_resultado | Auditoria.resultado | exito, fallo |

### Reglas de rango y coherencia
| Restricción | Tabla | Condición |
|---|---|---|
| CK_Apuesta_monto | Apuesta | monto > 0 |
| CK_Apuesta_cuota | Apuesta | cuota_congelada > 0 |
| CK_Recarga_monto | Recarga | monto > 0 |
| CK_Movimiento_monto | MovimientoSaldo | monto > 0 |
| CK_Movimiento_saldo | MovimientoSaldo | saldo_resultante ≥ 0 |
| CK_SaldoCuenta_saldo | SaldoCuenta | saldo_actual ≥ 0 |
| CK_Liquidacion_premio | Liquidacion | monto_premio ≥ 0 |
| CK_OpcionApuesta_cuota | OpcionApuesta | cuota_vigente > 0 |
| CK_HistorialCuota_valor | HistorialCuota | valor_cuota > 0 |
| CK_Estadio_capacidad | Estadio | capacidad ≥ 0 |
| CK_Resultado_marcadores | Resultado | marcador_local ≥ 0 AND marcador_visitante ≥ 0 |
| CK_Evento_equipos | Evento | id_equipo_local <> id_equipo_visitante |
| CK_Temporada_fechas | Temporada | fecha_inicio ≤ fecha_fin |
| CK_Mercado_fechas | Mercado | fecha_apertura ≤ fecha_cierre |
| CK_Token_fechas | TokenRecuperacion | fecha_expiracion > fecha_emision |
| CK_Movimiento_origen | MovimientoSaldo | (id_apuesta IS NULL OR id_recarga IS NULL) |

**Reglas que un `CHECK` no puede expresar** (van a proceso/backend): fechas "no futuras" (`GETDATE()` no es determinista) y validaciones **entre tablas** (saldo suficiente, coherencia opción↔mercado↔evento).

## 5. Valores por defecto (DEFAULT)

| Tabla · columna | Default |
|---|---|
| Rol.estado, Deporte.estado, Liga.estado, Equipo.estado, Arbitro.estado, TipoSaldo.estado, PreguntaSeguridad.estado | `'vigente'` |
| Usuario.estado | `'activo'` |
| TokenRecuperacion.estado | `'vigente'` |
| Temporada.estado | `'en_curso'` |
| Evento.estado | `'programado'` |
| CalendarioArbitro.rol_arbitro | `'principal'` |
| Mercado.estado | `'abierto'` |
| OpcionApuesta.estado | `'habilitada'` |
| Apuesta.tipo_apuesta | `'simple'` |
| Apuesta.estado | `'pendiente'` |
| SaldoCuenta.saldo_actual | `0` |
| Recarga.estado | `'aplicada'` |
| Resultado.marcador_local, marcador_visitante | `0` |
| Resultado.estado | `'provisional'` |
| Liquidacion.monto_premio | `0` |
| Liquidacion.estado | `'aplicada'` |
| Notificacion.estado | `'no_leida'` |
| Marcas de tiempo | `SYSDATETIME()` en: Usuario.fecha_registro, RespuestaSeguridad.fecha_registro, TokenRecuperacion.fecha_emision, CalendarioArbitro.fecha_designacion, Mercado.fecha_apertura, HistorialCuota.fecha_hora_cambio, Apuesta.fecha_hora_registro, FavoritoEquipo.fecha_marcado, SaldoCuenta.fecha_ultima_actualizacion, MovimientoSaldo.fecha_hora, Recarga.fecha_hora, Resultado.fecha_registro, Liquidacion.fecha_hora, Notificacion.fecha_hora, Auditoria.fecha_hora |
