# Reglas de validación — ApuestaDB (Fase 5)

**Base:** modelo lógico normalizado en 3FN (Fases 1–4.1) · Sin SQL ni tipos físicos.
> Este documento reúne las reglas que el modelo físico y el backend deberán hacer cumplir: **dominio, obligatoriedad, unicidad, integridad referencial, integridad de negocio y reglas de proceso**.

---

## 1. Clasificación de reglas

| Tipo | Descripción | Se implementa en |
|---|---|---|
| **Dominio** | Valores válidos de un campo | restricción declarativa del modelo físico |
| **Obligatoriedad** | Campos que no admiten ausencia | restricción declarativa |
| **Unicidad** | Valores o combinaciones únicas | restricción declarativa |
| **Integridad referencial** | Toda FK debe existir | restricción declarativa |
| **Integridad de negocio** | Reglas del dominio (rangos, coherencia) | restricción declarativa y/o validación en backend |
| **Proceso / transaccional** | Operaciones atómicas y de estado | transacciones y lógica de negocio |

---

## 2. Reglas de dominio

| # | Campo(s) | Regla |
|---|---|---|
| D-01 | Campos de estado | Solo valores del enumerado correspondiente (ver `ATRIBUTOS.md` §2) |
| D-02 | `Apuesta.monto`, `Recarga.monto`, `MovimientoSaldo.monto` | > 0 |
| D-03 | `SaldoCuenta.saldo_actual`, `MovimientoSaldo.saldo_resultante`, `Liquidacion.monto_premio` | ≥ 0 |
| D-04 | `OpcionApuesta.cuota_vigente`, `HistorialCuota.valor_cuota`, `Apuesta.cuota_congelada` | > 0 |
| D-05 | `Resultado.marcador_local`, `Resultado.marcador_visitante`, `Estadio.capacidad` | ≥ 0 (entero) |
| D-06 | `Usuario.correo` | formato de correo válido |
| D-07 | `Temporada.fecha_inicio` / `fecha_fin` | fecha_inicio ≤ fecha_fin |
| D-08 | `Mercado.fecha_apertura` / `fecha_cierre` | apertura ≤ cierre |
| D-09 | `TokenRecuperacion.fecha_expiracion` | > fecha_emision |
| D-10 | `Usuario.fecha_registro`, `Equipo.fecha_fundacion` | no pueden ser futuras |

## 3. Reglas de obligatoriedad

- **Obligatorios:** todos los campos marcados "Obligatorio" en `TABLAS_DETALLADAS.md` (no admiten ausencia).
- **Opcionales (admiten ausencia):** `Usuario.telefono`, `Pais.codigo`, `Ciudad.region`, `Estadio.capacidad`, `Estadio.direccion`, `Equipo.siglas`, `Equipo.fecha_fundacion`, `Arbitro.categoria`, `Evento.descripcion`, `Mercado.descripcion`, `HistorialCuota.motivo`, `Recarga.observacion`, `Notificacion` (ninguno), `Auditoria.id_usuario`, `Auditoria.descripcion`, `Auditoria.direccion_origen`, `MovimientoSaldo.id_apuesta`, `MovimientoSaldo.id_recarga`, `MovimientoSaldo.referencia`, `TipoSaldo.descripcion`, `TipoMovimientoSaldo.descripcion`, `Rol.descripcion`.

## 4. Reglas de unicidad

| # | Tabla | Elemento único |
|---|---|---|
| U-01 | Rol | `nombre` |
| U-02 | Usuario | `correo`; `telefono` (si existe) |
| U-03 | PreguntaSeguridad | `enunciado` |
| U-04 | RespuestaSeguridad | (`id_usuario`, `id_pregunta`) |
| U-05 | TokenRecuperacion | `valor_token` |
| U-06 | Pais | `nombre`; `codigo` |
| U-07 | Ciudad | (`id_pais`, `nombre`) |
| U-08 | Estadio | (`id_ciudad`, `nombre`) |
| U-09 | Deporte | `nombre` |
| U-10 | Liga | (`id_deporte`, `nombre`) |
| U-11 | Temporada | (`id_liga`, `etiqueta`) |
| U-12 | Equipo | (`id_deporte`, `nombre`) |
| U-13 | Evento | (`id_temporada`, `id_equipo_local`, `id_equipo_visitante`, `fecha_hora_inicio`) |
| U-14 | CalendarioArbitro | (`id_evento`, `id_arbitro`) |
| U-15 | Mercado | (`id_evento`, `nombre`) |
| U-16 | OpcionApuesta | (`id_mercado`, `etiqueta`) |
| U-17 | HistorialCuota | (`id_opcion`, `fecha_hora_cambio`) |
| U-18 | FavoritoEquipo | (`id_usuario`, `id_equipo`) |
| U-19 | SaldoCuenta | (`id_usuario`, `id_tipo_saldo`) |
| U-20 | TipoSaldo | `nombre` |
| U-21 | TipoMovimientoSaldo | `nombre` |
| U-22 | Resultado | `id_evento` (un resultado por evento) |
| U-23 | Liquidacion | `id_apuesta` (una liquidación por apuesta) |

## 5. Reglas de integridad referencial

- **Toda FK debe apuntar a una fila existente** (sin huérfanos).
- **FK obligatorias:** `Usuario.id_rol`, `RespuestaSeguridad.id_usuario`/`id_pregunta`, `TokenRecuperacion.id_usuario`, `Ciudad.id_pais`, `Estadio.id_ciudad`, `Equipo.id_deporte`/`id_ciudad`, `Liga.id_deporte`, `Temporada.id_liga`, `Evento.id_temporada`/`id_equipo_local`/`id_equipo_visitante`/`id_estadio`, `CalendarioArbitro.id_evento`/`id_arbitro`, `Mercado.id_evento`, `OpcionApuesta.id_mercado`, `HistorialCuota.id_opcion`, `Apuesta.id_usuario`/`id_opcion`/`id_tipo_saldo`, `FavoritoEquipo.id_usuario`/`id_equipo`, `SaldoCuenta.id_usuario`/`id_tipo_saldo`, `MovimientoSaldo.id_saldo_cuenta`/`id_tipo_movimiento`, `Recarga.id_usuario`/`id_tipo_saldo`, `Resultado.id_evento`, `Liquidacion.id_apuesta`/`id_resultado`, `Notificacion.id_usuario`.
- **FK opcionales:** `MovimientoSaldo.id_apuesta`, `MovimientoSaldo.id_recarga`, `Auditoria.id_usuario`.
- **FK exclusivas:** `MovimientoSaldo.id_apuesta` y `id_recarga` son **mutuamente excluyentes** (a lo sumo uno de los dos).
- **FK compuesta:** `Apuesta (id_usuario, id_tipo_saldo) → SaldoCuenta (id_usuario, id_tipo_saldo)`.
- **Acciones de borrado esperadas:** **restringir** el borrado cuando existan dependientes transaccionales (Apuesta, Liquidacion, MovimientoSaldo, SaldoCuenta); no aplicar borrado en cascada sobre datos transaccionales.

## 6. Reglas de integridad de negocio

| # | Regla | Tablas afectadas |
|---|---|---|
| N-01 | Un equipo no puede jugar contra sí mismo | Evento (`id_equipo_local` ≠ `id_equipo_visitante`) — RN-16 |
| N-02 | La opción debe pertenecer al mercado y el mercado al evento del partido | OpcionApuesta → Mercado → Evento — RN-17 |
| N-03 | El monto apostado no puede superar el saldo disponible del tipo elegido | Apuesta vs SaldoCuenta — RN-08 |
| N-04 | Una apuesta usa un solo tipo de saldo | Apuesta.id_tipo_saldo — RN-03 |
| N-05 | El premio se abona al mismo tipo de saldo usado | Liquidacion + MovimientoSaldo — RN-04 |
| N-06 | No hay conversión entre tipos de saldo | TipoSaldo / SaldoCuenta — RN-05 |
| N-07 | Toda variación de saldo genera un movimiento | SaldoCuenta ↔ MovimientoSaldo — RN-18 |

## 7. Reglas de proceso (transaccionales)

| # | Regla | Descripción |
|---|---|---|
| P-01 | **Cuota congelada** | Al registrar la apuesta se copia la cuota vigente a `Apuesta.cuota_congelada`; cambios posteriores de cuota no la alteran (RN-10/RN-11). |
| P-02 | **Atomicidad apuesta–saldo** | El registro de la apuesta y el débito del saldo (con su movimiento) ocurren en una sola transacción (RN-12/RN-13). |
| P-03 | **Evento válido** | Solo se apuesta si el evento no está iniciado, finalizado, cancelado ni suspendido (RN-09). |
| P-04 | **Liquidación única** | Una apuesta se liquida una sola vez (unicidad de `Liquidacion.id_apuesta`) — RN-14. |
| P-05 | **Liquidación por resultado oficial** | La liquidación usa el resultado oficial del evento (RN-15); la opción ganadora se deriva del marcador. |
| P-06 | **Recálculo del saldo** | `SaldoCuenta.saldo_actual` y `MovimientoSaldo.saldo_resultante` se actualizan dentro de la misma transacción del movimiento. |
| P-07 | **Historial de cuota** | Todo cambio de `OpcionApuesta.cuota_vigente` inserta una fila en `HistorialCuota`. |
| P-08 | **Saldos iniciales** | Al registrar un usuario se crean sus cuentas de saldo (tokens y PSE) en cero (RN-02). |
| P-09 | **Recuperación segura** | Los tokens de recuperación son de un solo uso y expiran (RF-05). |

---

## 8. Trazabilidad con las reglas de negocio (RN-01..RN-21)

| Regla | Tipo | Regla(s) de validación |
|---|---|---|
| RN-01 | dominio/proceso | D-01, P-08 |
| RN-02 | proceso | P-08 |
| RN-03 | negocio | N-04 |
| RN-04 | negocio | N-05 |
| RN-05 | negocio | N-06 |
| RN-06 | dominio | D-01 |
| RN-07 | dominio | D-02 |
| RN-08 | negocio | N-03 |
| RN-09 | proceso | P-03 |
| RN-10 | proceso | P-01 |
| RN-11 | proceso | P-01 |
| RN-12 | proceso | P-02 |
| RN-13 | proceso | P-02 |
| RN-14 | unicidad | U-23, P-04 |
| RN-15 | proceso | P-05 |
| RN-16 | negocio | N-01 |
| RN-17 | negocio | N-02 |
| RN-18 | negocio | N-07 |
| RN-19 | integridad | §5, P-06 |
| RN-20 | dominio | D-06 (y regla de hash en Usuario.contrasena) |
| RN-21 | dominio | D-01, D-07..D-10 |
