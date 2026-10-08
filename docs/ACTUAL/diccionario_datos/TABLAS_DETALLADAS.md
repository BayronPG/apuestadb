# Tablas detalladas — ApuestaDB (Diccionario de datos · Fase 5)

**Base:** modelo lógico normalizado en 3FN (Fases 1–4.1) · **29 tablas**.
**Sin** tipos de datos físicos, SQL Server, `CREATE TABLE`, índices, triggers ni procedimientos.
> Cada ficha incluye: descripción, propósito, reglas de negocio asociadas, PK/CK/FK y el detalle de campos (nombre, descripción, dominio, obligatoriedad, restricciones, observaciones).
> **Obligatoriedad:** Obligatorio (no admite ausencia) · Opcional (admite ausencia).

---

## Dominio 1 — Seguridad y usuarios

### T-01 · Rol
- **Descripción:** catálogo de categorías de acceso del sistema.
- **Propósito:** clasificar los permisos funcionales de cada usuario.
- **Reglas asociadas:** RF-04, RNF-02.
- **PK:** `id_rol` · **CK:** `nombre` · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_rol | identificador del rol | Identificador | Obligatorio | único | — |
| nombre | nombre del rol | Enumerado RolNombre | Obligatorio | único | usuario / administrador |
| descripcion | alcance del rol | Texto descriptivo | Opcional | — | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | por defecto "vigente" |

### T-02 · Usuario
- **Descripción:** persona registrada que puede apostar o administrar.
- **Propósito:** conservar identidad, credenciales y estado del usuario.
- **Reglas asociadas:** RF-01..RF-06, RN-20.
- **PK:** `id_usuario` · **CK:** `correo` · **FK:** `id_rol → Rol`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_usuario | identificador | Identificador | Obligatorio | único | — |
| id_rol | rol asignado | Identificador | Obligatorio | FK → Rol | — |
| nombres | nombre(s) | Nombre propio | Obligatorio | no vacío | — |
| apellidos | apellido(s) | Nombre propio | Obligatorio | no vacío | — |
| correo | correo de acceso | Correo electrónico | Obligatorio | único, formato de correo | — |
| contrasena | credencial | Credencial protegida | Obligatorio | almacenada con hash | nunca en texto plano (RN-20) |
| telefono | contacto | Teléfono | Opcional | único si existe | valor simple (un solo número) |
| estado | vigencia | Enumerado EstadoUsuario | Obligatorio | — | activo / inhabilitado |
| fecha_registro | alta del usuario | Fecha y hora | Obligatorio | no futura | — |

### T-03 · PreguntaSeguridad
- **Descripción:** catálogo de preguntas de seguridad.
- **Propósito:** soportar la recuperación de contraseña.
- **Reglas asociadas:** RF-05.
- **PK:** `id_pregunta` · **CK:** `enunciado` · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_pregunta | identificador | Identificador | Obligatorio | único | — |
| enunciado | texto de la pregunta | Texto descriptivo | Obligatorio | único | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | — |

### T-04 · RespuestaSeguridad
- **Descripción:** respuesta de un usuario a una pregunta de seguridad.
- **Propósito:** verificar la identidad del usuario.
- **Reglas asociadas:** RF-05.
- **PK:** `id_respuesta` · **CK:** (`id_usuario`, `id_pregunta`) · **FK:** `id_usuario → Usuario`, `id_pregunta → PreguntaSeguridad`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_respuesta | identificador | Identificador | Obligatorio | único | — |
| id_usuario | usuario | Identificador | Obligatorio | FK → Usuario | — |
| id_pregunta | pregunta | Identificador | Obligatorio | FK → PreguntaSeguridad | — |
| respuesta | respuesta configurada | Credencial protegida | Obligatorio | almacenada protegida | el par (usuario, pregunta) es único |
| fecha_registro | alta | Fecha y hora | Obligatorio | — | — |

### T-05 · TokenRecuperacion
- **Descripción:** credencial temporal de restablecimiento de contraseña.
- **Propósito:** controlar el proceso de recuperación.
- **Reglas asociadas:** RF-05.
- **PK:** `id_token` · **CK:** `valor_token` · **FK:** `id_usuario → Usuario`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_token | identificador | Identificador | Obligatorio | único | — |
| id_usuario | usuario | Identificador | Obligatorio | FK → Usuario | — |
| valor_token | token emitido | Token | Obligatorio | único | — |
| fecha_emision | emisión | Fecha y hora | Obligatorio | — | — |
| fecha_expiracion | vencimiento | Fecha y hora | Obligatorio | > fecha_emision | — |
| estado | vigencia | Enumerado EstadoToken | Obligatorio | — | vigente / usado / expirado |

---

## Dominio 2 — Catálogo deportivo

### T-06 · Pais
- **Descripción:** catálogo de países.
- **Propósito:** normalizar el origen geográfico.
- **Reglas asociadas:** RF-09.
- **PK:** `id_pais` · **CK:** `nombre`, `codigo` · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_pais | identificador | Identificador | Obligatorio | único | — |
| nombre | nombre del país | Nombre propio | Obligatorio | único | — |
| codigo | sigla normalizada | Código | Opcional | único si existe | — |

### T-07 · Ciudad
- **Descripción:** catálogo de ciudades.
- **Propósito:** ubicar equipos y estadios.
- **Reglas asociadas:** RF-09, RF-10.
- **PK:** `id_ciudad` · **CK:** (`id_pais`, `nombre`) · **FK:** `id_pais → Pais`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_ciudad | identificador | Identificador | Obligatorio | único | — |
| id_pais | país | Identificador | Obligatorio | FK → Pais | — |
| nombre | nombre de la ciudad | Nombre propio | Obligatorio | único por país | — |
| region | departamento o región | Texto descriptivo | Opcional | — | — |

### T-08 · Estadio
- **Descripción:** escenario deportivo.
- **Propósito:** identificar la sede del evento.
- **Reglas asociadas:** RF-10.
- **PK:** `id_estadio` · **CK:** (`id_ciudad`, `nombre`) · **FK:** `id_ciudad → Ciudad`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_estadio | identificador | Identificador | Obligatorio | único | — |
| id_ciudad | ciudad | Identificador | Obligatorio | FK → Ciudad | — |
| nombre | nombre del escenario | Nombre propio | Obligatorio | único por ciudad | — |
| capacidad | aforo | Capacidad | Opcional | ≥ 0 | — |
| direccion | ubicación | Dirección | Opcional | — | — |

### T-09 · Deporte
- **Descripción:** disciplina deportiva (inicial: fútbol).
- **Propósito:** clasificar ligas y equipos.
- **Reglas asociadas:** RF-07.
- **PK:** `id_deporte` · **CK:** `nombre` · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_deporte | identificador | Identificador | Obligatorio | único | — |
| nombre | nombre del deporte | Nombre propio | Obligatorio | único | — |
| descripcion | detalle | Texto descriptivo | Opcional | — | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | — |

### T-10 · Liga
- **Descripción:** torneo o competición.
- **Propósito:** organizar los eventos por competencia.
- **Reglas asociadas:** RF-08.
- **PK:** `id_liga` · **CK:** (`id_deporte`, `nombre`) · **FK:** `id_deporte → Deporte`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_liga | identificador | Identificador | Obligatorio | único | — |
| id_deporte | deporte | Identificador | Obligatorio | FK → Deporte | — |
| nombre | nombre de la liga | Nombre propio | Obligatorio | único por deporte | — |
| categoria | división o categoría | Texto descriptivo | Opcional | — | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | — |

### T-11 · Temporada
- **Descripción:** período en que se disputa una liga.
- **Propósito:** programar los eventos por temporada.
- **Reglas asociadas:** RF-10.
- **PK:** `id_temporada` · **CK:** (`id_liga`, `etiqueta`) · **FK:** `id_liga → Liga`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_temporada | identificador | Identificador | Obligatorio | único | — |
| id_liga | liga | Identificador | Obligatorio | FK → Liga | — |
| etiqueta | nombre del período | Etiqueta corta | Obligatorio | único por liga | p. ej. "2026" |
| fecha_inicio | inicio | Fecha | Obligatorio | ≤ fecha_fin | — |
| fecha_fin | fin | Fecha | Obligatorio | ≥ fecha_inicio | — |
| estado | vigencia | Enumerado EstadoTemporada | Obligatorio | — | en curso / finalizada |

### T-12 · Equipo
- **Descripción:** equipo participante.
- **Propósito:** identificar a los contendientes del evento.
- **Reglas asociadas:** RF-09, RN-16.
- **PK:** `id_equipo` · **CK:** (`id_deporte`, `nombre`) · **FK:** `id_deporte → Deporte`, `id_ciudad → Ciudad`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_equipo | identificador | Identificador | Obligatorio | único | — |
| id_deporte | deporte | Identificador | Obligatorio | FK → Deporte | — |
| id_ciudad | ciudad de origen | Identificador | Obligatorio | FK → Ciudad | — |
| nombre | nombre del equipo | Nombre propio | Obligatorio | único por deporte | — |
| siglas | abreviatura | Etiqueta corta | Opcional | — | — |
| fecha_fundacion | fundación | Fecha | Opcional | no futura | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | — |

### T-13 · Arbitro
- **Descripción:** árbitro de los eventos.
- **Propósito:** registrar quién dirige cada encuentro.
- **Reglas asociadas:** RF-10.
- **PK:** `id_arbitro` · **CK:** (`nombres`, `apellidos`)* · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_arbitro | identificador | Identificador | Obligatorio | único | — |
| nombres | nombre(s) | Nombre propio | Obligatorio | no vacío | — |
| apellidos | apellido(s) | Nombre propio | Obligatorio | no vacío | — |
| categoria | nivel arbitral | Texto descriptivo | Opcional | — | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | — |

`*` Cuasi-candidata: a validar con datos reales.

### T-14 · Evento
- **Descripción:** encuentro deportivo entre dos equipos.
- **Propósito:** ser el objeto central de mercados y apuestas.
- **Reglas asociadas:** RF-10, RF-14, RN-09, RN-16.
- **PK:** `id_evento` · **CK:** (`id_temporada`, `id_equipo_local`, `id_equipo_visitante`, `fecha_hora_inicio`) · **FK:** `id_temporada → Temporada`, `id_equipo_local → Equipo`, `id_equipo_visitante → Equipo`, `id_estadio → Estadio`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_evento | identificador | Identificador | Obligatorio | único | — |
| id_temporada | temporada | Identificador | Obligatorio | FK → Temporada | — |
| id_equipo_local | equipo local | Identificador | Obligatorio | FK → Equipo | ≠ id_equipo_visitante (RN-16) |
| id_equipo_visitante | equipo visitante | Identificador | Obligatorio | FK → Equipo | ≠ id_equipo_local (RN-16) |
| id_estadio | sede | Identificador | Obligatorio | FK → Estadio | — |
| fecha_hora_inicio | inicio del partido | Fecha y hora | Obligatorio | — | — |
| estado | situación | Enumerado EstadoEvento | Obligatorio | — | programado / en curso / finalizado / cancelado / suspendido |
| descripcion | observaciones | Texto descriptivo | Opcional | — | — |

### T-15 · CalendarioArbitro
- **Descripción:** designación de árbitros a eventos.
- **Propósito:** resolver la relación Evento ↔ Árbitro.
- **Reglas asociadas:** RF-10.
- **PK:** `id_calendario` · **CK:** (`id_evento`, `id_arbitro`) · **FK:** `id_evento → Evento`, `id_arbitro → Arbitro`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_calendario | identificador | Identificador | Obligatorio | único | — |
| id_evento | evento | Identificador | Obligatorio | FK → Evento | — |
| id_arbitro | árbitro | Identificador | Obligatorio | FK → Arbitro | — |
| rol_arbitro | función en el partido | Enumerado RolArbitro | Obligatorio | — | principal / asistente |
| fecha_designacion | asignación | Fecha y hora | Obligatorio | — | — |

### T-16 · Mercado
- **Descripción:** tipo de apuesta ofrecido sobre un evento.
- **Propósito:** agrupar las opciones apostables.
- **Reglas asociadas:** RF-11.
- **PK:** `id_mercado` · **CK:** (`id_evento`, `nombre`) · **FK:** `id_evento → Evento`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_mercado | identificador | Identificador | Obligatorio | único | — |
| id_evento | evento | Identificador | Obligatorio | FK → Evento | — |
| nombre | tipo de mercado | Etiqueta corta | Obligatorio | único por evento | "resultado del partido" |
| descripcion | explicación | Texto descriptivo | Opcional | — | — |
| fecha_apertura | apertura | Fecha y hora | Obligatorio | ≤ fecha_cierre | — |
| fecha_cierre | cierre | Fecha y hora | Obligatorio | ≥ fecha_apertura | — |
| estado | situación | Enumerado EstadoMercado | Obligatorio | — | abierto / cerrado / anulado |

### T-17 · OpcionApuesta
- **Descripción:** resultado posible dentro de un mercado, con su cuota.
- **Propósito:** representar lo que se puede apostar y su cuota.
- **Reglas asociadas:** RF-12, RN-10, RN-11.
- **PK:** `id_opcion` · **CK:** (`id_mercado`, `etiqueta`) · **FK:** `id_mercado → Mercado`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_opcion | identificador | Identificador | Obligatorio | único | — |
| id_mercado | mercado | Identificador | Obligatorio | FK → Mercado | — |
| etiqueta | resultado posible | Enumerado EtiquetaOpcion | Obligatorio | único por mercado | local / empate / visitante |
| cuota_vigente | cuota actual | Cuota | Obligatorio | > 0 | snapshot controlado (ver HistorialCuota) |
| estado | situación | Enumerado EstadoOpcion | Obligatorio | — | habilitada / deshabilitada |

### T-18 · HistorialCuota
- **Descripción:** registro de cambios de cuota de una opción.
- **Propósito:** conservar la evolución de la cuota.
- **Reglas asociadas:** RN-10, RN-11.
- **PK:** `id_historial` · **CK:** (`id_opcion`, `fecha_hora_cambio`) · **FK:** `id_opcion → OpcionApuesta`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_historial | identificador | Identificador | Obligatorio | único | — |
| id_opcion | opción | Identificador | Obligatorio | FK → OpcionApuesta | — |
| valor_cuota | cuota registrada | Cuota | Obligatorio | > 0 | — |
| fecha_hora_cambio | momento del cambio | Fecha y hora | Obligatorio | único por opción | — |
| motivo | razón del cambio | Texto descriptivo | Opcional | — | — |

---

## Dominio 3 — Apuestas

### T-19 · Apuesta
- **Descripción:** apuesta simple de un usuario sobre una opción.
- **Propósito:** registrar el monto y la cuota congelada de la apuesta.
- **Reglas asociadas:** RF-13..RF-18, RN-07..RN-15.
- **PK:** `id_apuesta` · **CK:** (`id_usuario`, `id_opcion`, `fecha_hora_registro`)* · **FK:** `id_usuario → Usuario`, `id_opcion → OpcionApuesta`, `id_tipo_saldo → TipoSaldo`, (`id_usuario`, `id_tipo_saldo`) → `SaldoCuenta`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_apuesta | identificador | Identificador | Obligatorio | único | — |
| id_usuario | apostador | Identificador | Obligatorio | FK → Usuario | — |
| id_opcion | opción apostada | Identificador | Obligatorio | FK → OpcionApuesta | — |
| id_tipo_saldo | tipo de saldo usado | Identificador | Obligatorio | FK → TipoSaldo | un solo tipo (RN-03) |
| monto | valor apostado | Monto de apuesta | Obligatorio | > 0, ≤ saldo disponible | RN-07, RN-08 |
| cuota_congelada | cuota aceptada | Cuota | Obligatorio | > 0 | se copia al registrar (RN-10) |
| tipo_apuesta | modalidad | Enumerado TipoApuesta | Obligatorio | — | simple |
| estado | situación | Enumerado EstadoApuesta | Obligatorio | — | pendiente / ganada / perdida / anulada |
| fecha_hora_registro | registro | Fecha y hora | Obligatorio | — | — |

`*` Cuasi-candidata: a validar con datos reales.

### T-20 · FavoritoEquipo
- **Descripción:** equipo marcado como favorito por un usuario.
- **Propósito:** resolver la relación Usuario ↔ Equipo.
- **Reglas asociadas:** RF-06.
- **PK:** `id_favorito` · **CK:** (`id_usuario`, `id_equipo`) · **FK:** `id_usuario → Usuario`, `id_equipo → Equipo`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_favorito | identificador | Identificador | Obligatorio | único | — |
| id_usuario | usuario | Identificador | Obligatorio | FK → Usuario | — |
| id_equipo | equipo favorito | Identificador | Obligatorio | FK → Equipo | — |
| fecha_marcado | cuándo se marcó | Fecha y hora | Obligatorio | — | — |

---

## Dominio 4 — Saldo ficticio

### T-21 · TipoSaldo
- **Descripción:** tipos de saldo ficticio (tokens y PSE).
- **Propósito:** tipificar el saldo y sus reglas.
- **Reglas asociadas:** RN-01..RN-06.
- **PK:** `id_tipo_saldo` · **CK:** `nombre` · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_tipo_saldo | identificador | Identificador | Obligatorio | único | — |
| nombre | tipo de saldo | Enumerado TipoSaldoNombre | Obligatorio | único | tokens / PSE |
| descripcion | explicación | Texto descriptivo | Opcional | — | — |
| estado | vigencia | Enumerado EstadoGenerico | Obligatorio | — | — |

### T-22 · SaldoCuenta
- **Descripción:** saldo de un usuario para un tipo de saldo.
- **Propósito:** mantener el saldo disponible y validar apuestas.
- **Reglas asociadas:** RN-02, RN-08.
- **PK:** `id_saldo_cuenta` · **CK:** (`id_usuario`, `id_tipo_saldo`) · **FK:** `id_usuario → Usuario`, `id_tipo_saldo → TipoSaldo`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_saldo_cuenta | identificador | Identificador | Obligatorio | único | — |
| id_usuario | titular | Identificador | Obligatorio | FK → Usuario | — |
| id_tipo_saldo | tipo de saldo | Identificador | Obligatorio | FK → TipoSaldo | una cuenta por usuario y tipo |
| saldo_actual | saldo disponible | Importe ficticio | Obligatorio | ≥ 0 | snapshot controlado (cache) |
| fecha_ultima_actualizacion | último cambio | Fecha y hora | Obligatorio | — | — |

### T-23 · MovimientoSaldo
- **Descripción:** débito o crédito aplicado a una cuenta de saldo.
- **Propósito:** dejar trazabilidad de toda variación de saldo.
- **Reglas asociadas:** RF-22, RN-18, RN-19.
- **PK:** `id_movimiento` · **CK:** (`id_saldo_cuenta`, `fecha_hora`, `id_tipo_movimiento`) · **FK:** `id_saldo_cuenta → SaldoCuenta`, `id_tipo_movimiento → TipoMovimientoSaldo`, `id_apuesta → Apuesta`, `id_recarga → Recarga`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_movimiento | identificador | Identificador | Obligatorio | único | — |
| id_saldo_cuenta | cuenta afectada | Identificador | Obligatorio | FK → SaldoCuenta | — |
| id_tipo_movimiento | concepto | Identificador | Obligatorio | FK → TipoMovimientoSaldo | — |
| id_apuesta | apuesta origen | Identificador | Opcional | FK → Apuesta | excluyente con id_recarga |
| id_recarga | recarga origen | Identificador | Opcional | FK → Recarga | excluyente con id_apuesta |
| monto | valor del movimiento | Importe ficticio | Obligatorio | > 0 | — |
| saldo_resultante | saldo tras el movimiento | Importe ficticio | Obligatorio | ≥ 0 | snapshot controlado |
| fecha_hora | momento | Fecha y hora | Obligatorio | — | — |
| referencia | vínculo descriptivo | Referencia | Opcional | — | apoyo a la trazabilidad |

### T-24 · TipoMovimientoSaldo
- **Descripción:** catálogo de conceptos de movimiento.
- **Propósito:** clasificar los movimientos de saldo.
- **Reglas asociadas:** RF-22.
- **PK:** `id_tipo_movimiento` · **CK:** `nombre` · **FK:** —

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_tipo_movimiento | identificador | Identificador | Obligatorio | único | — |
| nombre | concepto | Enumerado NombreTipoMovimiento | Obligatorio | único | apuesta / premio / recarga / ajuste |
| naturaleza | efecto sobre el saldo | Enumerado NaturalezaMovimiento | Obligatorio | — | débito / crédito |
| descripcion | explicación | Texto descriptivo | Opcional | — | — |

### T-25 · Recarga
- **Descripción:** ingreso de saldo ficticio a favor de un usuario.
- **Propósito:** documentar el origen de un incremento de saldo.
- **Reglas asociadas:** RF-21, RN-06.
- **PK:** `id_recarga` · **CK:** (`id_usuario`, `id_tipo_saldo`, `fecha_hora`)* · **FK:** `id_usuario → Usuario`, `id_tipo_saldo → TipoSaldo`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_recarga | identificador | Identificador | Obligatorio | único | — |
| id_usuario | beneficiario | Identificador | Obligatorio | FK → Usuario | — |
| id_tipo_saldo | tipo de saldo | Identificador | Obligatorio | FK → TipoSaldo | tokens o PSE |
| monto | valor recargado | Importe ficticio | Obligatorio | > 0 | — |
| fecha_hora | momento | Fecha y hora | Obligatorio | — | — |
| estado | situación | Enumerado EstadoRecarga | Obligatorio | — | aplicada / anulada |
| observacion | nota del administrador | Texto descriptivo | Opcional | — | — |

`*` Cuasi-candidata: a validar con datos reales.

---

## Dominio 5 — Resultados y liquidación

### T-26 · Resultado
- **Descripción:** resultado oficial de un evento (marcador).
- **Propósito:** ser la fuente de verdad para liquidar apuestas.
- **Reglas asociadas:** RF-23, RN-15.
- **PK:** `id_resultado` · **CK:** `id_evento` · **FK:** `id_evento → Evento`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_resultado | identificador | Identificador | Obligatorio | único | — |
| id_evento | evento | Identificador | Obligatorio | FK → Evento, único | un resultado por evento (1:1) |
| marcador_local | anotaciones del local | Marcador | Obligatorio | ≥ 0 | fuente de verdad (Fase 4.1) |
| marcador_visitante | anotaciones del visitante | Marcador | Obligatorio | ≥ 0 | fuente de verdad (Fase 4.1) |
| fecha_registro | registro | Fecha y hora | Obligatorio | — | — |
| estado | situación | Enumerado EstadoResultado | Obligatorio | — | oficial / provisional |

### T-27 · Liquidacion
- **Descripción:** cierre de una apuesta según el resultado.
- **Propósito:** marcar la apuesta como resuelta y registrar el premio.
- **Reglas asociadas:** RF-24, RF-25, RN-14, RN-15.
- **PK:** `id_liquidacion` · **CK:** `id_apuesta` · **FK:** `id_apuesta → Apuesta`, `id_resultado → Resultado`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_liquidacion | identificador | Identificador | Obligatorio | único | — |
| id_apuesta | apuesta liquidada | Identificador | Obligatorio | FK → Apuesta, único | una liquidación por apuesta (RN-14) |
| id_resultado | resultado aplicado | Identificador | Obligatorio | FK → Resultado | — |
| resultado_liquidacion | desenlace | Enumerado ResultadoLiquidacion | Obligatorio | — | ganada / perdida / anulada |
| monto_premio | premio abonado | Importe ficticio | Obligatorio | ≥ 0 | snapshot controlado (monto × cuota) |
| fecha_hora | momento | Fecha y hora | Obligatorio | — | — |
| estado | situación | Enumerado EstadoLiquidacion | Obligatorio | — | aplicada / revertida |

---

## Dominio 6 — Auditoría y soporte

### T-28 · Notificacion
- **Descripción:** aviso dirigido a un usuario.
- **Propósito:** informar hechos relevantes de su cuenta o apuestas.
- **Reglas asociadas:** RNF-06.
- **PK:** `id_notificacion` · **CK:** — · **FK:** `id_usuario → Usuario`

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_notificacion | identificador | Identificador | Obligatorio | único | — |
| id_usuario | destinatario | Identificador | Obligatorio | FK → Usuario | — |
| mensaje | contenido del aviso | Texto descriptivo | Obligatorio | no vacío | — |
| tipo | clase de aviso | Texto descriptivo | Obligatorio | — | — |
| fecha_hora | generación | Fecha y hora | Obligatorio | — | — |
| estado | lectura | Enumerado EstadoNotificacion | Obligatorio | — | no leída / leída |

### T-29 · Auditoria
- **Descripción:** registro de operaciones importantes.
- **Propósito:** conservar la trazabilidad de quién hizo qué y cuándo.
- **Reglas asociadas:** RF-29, RNF-06.
- **PK:** `id_auditoria` · **CK:** — · **FK:** `id_usuario → Usuario` (opcional)

| Campo | Descripción | Dominio | Obligatoriedad | Restricciones | Observaciones |
|---|---|---|---|---|---|
| id_auditoria | identificador | Identificador | Obligatorio | único | — |
| id_usuario | usuario que actuó | Identificador | Opcional | FK → Usuario | opcional (operaciones del sistema) |
| operacion | acción realizada | Texto descriptivo | Obligatorio | — | — |
| entidad_afectada | objeto de la acción | Texto descriptivo | Obligatorio | — | — |
| descripcion | detalle | Texto descriptivo | Opcional | — | — |
| fecha_hora | momento | Fecha y hora | Obligatorio | — | — |
| resultado | desenlace | Enumerado ResultadoAuditoria | Obligatorio | — | éxito / fallo |
| direccion_origen | origen de la operación | Origen de red | Opcional | — | — |
