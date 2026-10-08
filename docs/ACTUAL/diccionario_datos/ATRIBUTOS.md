# Catálogo de dominios y atributos — ApuestaDB

**Fase 5 · Diccionario de datos** · Sin tipos de datos físicos.
> Este documento define **una sola vez** cada dominio de negocio y lista los atributos que lo usan en las 29 tablas, para mantener coherencia terminológica.

---

## 1. Dominios de negocio

| Dominio | Definición | Valores / convención |
|---|---|---|
| **Identificador** | Clave sustituta de una tabla | entero positivo, único dentro de su tabla |
| **Nombre propio** | Nombre de persona, equipo, país, ciudad, liga o estadio | texto no vacío |
| **Correo electrónico** | Dirección de correo del usuario | formato `usuario@dominio`; único |
| **Credencial protegida** | Secreto almacenado de forma irreversible | valor hash; nunca en texto plano |
| **Token** | Credencial temporal de un solo uso | cadena única; con vigencia |
| **Texto descriptivo** | Texto libre explicativo | puede estar vacío (opcional) |
| **Etiqueta corta** | Texto breve de identificación | no vacío |
| **Código** | Sigla normalizada | corto; único |
| **Fecha** | Fecha sin hora | fecha válida |
| **Fecha y hora** | Marca temporal | instante válido |
| **Importe ficticio** | Valor monetario simulado | ≥ 0; sin dinero real |
| **Monto de apuesta** | Valor apostado | > 0 |
| **Cuota** | Factor de pago | > 0 (habitualmente ≥ 1) |
| **Marcador** | Anotaciones de un equipo | entero ≥ 0 |
| **Capacidad** | Aforo de un escenario | entero ≥ 0 |
| **Teléfono** | Número de contacto | opcional; valor único |
| **Dirección** | Ubicación física | texto libre |
| **Referencia** | Texto que vincula un movimiento con su origen | opcional |
| **Origen de red** | Dirección desde la que se ejecuta una operación | opcional |
| **Enumerado** | Conjunto cerrado de valores de negocio | ver tabla de enumerados |

## 2. Dominios enumerados

| Enumerado | Valores |
|---|---|
| **RolNombre** | usuario · administrador |
| **EstadoGenerico** | vigente · inactivo |
| **EstadoUsuario** | activo · inhabilitado |
| **EstadoToken** | vigente · usado · expirado |
| **EstadoTemporada** | en curso · finalizada |
| **EstadoEvento** | programado · en curso · finalizado · cancelado · suspendido |
| **RolArbitro** | principal · asistente |
| **EstadoMercado** | abierto · cerrado · anulado |
| **EtiquetaOpcion** | local · empate · visitante |
| **EstadoOpcion** | habilitada · deshabilitada |
| **TipoApuesta** | simple |
| **EstadoApuesta** | pendiente · ganada · perdida · anulada |
| **TipoSaldoNombre** | tokens · PSE |
| **NombreTipoMovimiento** | apuesta · premio · recarga · ajuste |
| **NaturalezaMovimiento** | débito · crédito |
| **EstadoRecarga** | aplicada · anulada |
| **EstadoResultado** | oficial · provisional |
| **ResultadoLiquidacion** | ganada · perdida · anulada |
| **EstadoLiquidacion** | aplicada · revertida |
| **EstadoNotificacion** | no leída · leída |
| **ResultadoAuditoria** | éxito · fallo |

---

## 3. Atributos por dominio

### Identificador
`Rol.id_rol`, `Usuario.id_usuario`, `PreguntaSeguridad.id_pregunta`, `RespuestaSeguridad.id_respuesta`, `TokenRecuperacion.id_token`, `Pais.id_pais`, `Ciudad.id_ciudad`, `Estadio.id_estadio`, `Deporte.id_deporte`, `Liga.id_liga`, `Temporada.id_temporada`, `Equipo.id_equipo`, `Arbitro.id_arbitro`, `Evento.id_evento`, `CalendarioArbitro.id_calendario`, `Mercado.id_mercado`, `OpcionApuesta.id_opcion`, `HistorialCuota.id_historial`, `Apuesta.id_apuesta`, `FavoritoEquipo.id_favorito`, `TipoSaldo.id_tipo_saldo`, `SaldoCuenta.id_saldo_cuenta`, `MovimientoSaldo.id_movimiento`, `TipoMovimientoSaldo.id_tipo_movimiento`, `Recarga.id_recarga`, `Resultado.id_resultado`, `Liquidacion.id_liquidacion`, `Notificacion.id_notificacion`, `Auditoria.id_auditoria`.

### Nombre propio
`Rol.nombre`, `Pais.nombre`, `Ciudad.nombre`, `Estadio.nombre`, `Deporte.nombre`, `Liga.nombre`, `Equipo.nombre`, `Arbitro.nombres`, `Arbitro.apellidos`, `Usuario.nombres`, `Usuario.apellidos`, `TipoSaldo.nombre`, `TipoMovimientoSaldo.nombre`, `Mercado.nombre`.

### Correo electrónico
`Usuario.correo`.

### Credencial protegida
`Usuario.contrasena`, `RespuestaSeguridad.respuesta`.

### Token
`TokenRecuperacion.valor_token`.

### Texto descriptivo / etiqueta / código
`Rol.descripcion`, `Deporte.descripcion`, `Liga.categoria`, `Mercado.descripcion`, `TipoSaldo.descripcion`, `TipoMovimientoSaldo.descripcion`, `Evento.descripcion`, `Recarga.observacion`, `Auditoria.descripcion`, `HistorialCuota.motivo`, `Notificacion.mensaje`, `Notificacion.tipo`, `Auditoria.operacion`, `Auditoria.entidad_afectada`, `MovimientoSaldo.referencia`, `PreguntaSeguridad.enunciado`, `Temporada.etiqueta`, `Equipo.siglas`, `Pais.codigo`, `Estadio.direccion`, `Ciudad.region`, `Usuario.telefono`, `Auditoria.direccion_origen`.

### Fecha / Fecha y hora
`Usuario.fecha_registro`, `RespuestaSeguridad.fecha_registro`, `TokenRecuperacion.fecha_emision`, `TokenRecuperacion.fecha_expiracion`, `Temporada.fecha_inicio`, `Temporada.fecha_fin`, `Equipo.fecha_fundacion`, `Evento.fecha_hora_inicio`, `CalendarioArbitro.fecha_designacion`, `Mercado.fecha_apertura`, `Mercado.fecha_cierre`, `HistorialCuota.fecha_hora_cambio`, `Apuesta.fecha_hora_registro`, `FavoritoEquipo.fecha_marcado`, `SaldoCuenta.fecha_ultima_actualizacion`, `MovimientoSaldo.fecha_hora`, `Recarga.fecha_hora`, `Resultado.fecha_registro`, `Liquidacion.fecha_hora`, `Notificacion.fecha_hora`, `Auditoria.fecha_hora`.

### Importe / Monto / Cuota / Marcador / Capacidad
`Apuesta.monto`, `Recarga.monto`, `MovimientoSaldo.monto`, `MovimientoSaldo.saldo_resultante`, `SaldoCuenta.saldo_actual`, `Liquidacion.monto_premio`, `OpcionApuesta.cuota_vigente`, `HistorialCuota.valor_cuota`, `Apuesta.cuota_congelada`, `Resultado.marcador_local`, `Resultado.marcador_visitante`, `Estadio.capacidad`.

### Enumerados
`Rol.nombre`, `Rol.estado`, `Deporte.estado`, `Liga.estado`, `Temporada.estado`, `Equipo.estado`, `Arbitro.estado`, `Usuario.estado`, `PreguntaSeguridad.estado`, `TokenRecuperacion.estado`, `Evento.estado`, `CalendarioArbitro.rol_arbitro`, `Mercado.estado`, `OpcionApuesta.etiqueta`, `OpcionApuesta.estado`, `Apuesta.tipo_apuesta`, `Apuesta.estado`, `TipoSaldo.nombre`, `TipoMovimientoSaldo.nombre`, `TipoMovimientoSaldo.naturaleza`, `Recarga.estado`, `Resultado.estado`, `Liquidacion.resultado_liquidacion`, `Liquidacion.estado`, `Notificacion.estado`, `Auditoria.resultado`.

---

## 4. Convenciones de nombres

- **Claves sustitutas:** `id_<entidad>` (p. ej. `id_usuario`).
- **Claves foráneas:** mismo nombre que la PK referenciada (p. ej. `id_evento`).
- **FK con rol:** `id_equipo_local`, `id_equipo_visitante`.
- **Fechas:** prefijo `fecha_` (`fecha_registro`, `fecha_inicio`); con hora: `fecha_hora_*`.
- **Estados:** sufijo `estado`; naturaleza en tipo de movimiento.
- **Campos derivados/snapshot:** documentados en la sección siguiente (no se recalculan sin control).

## 5. Atributos derivados y snapshots

| Tipo | Atributo(s) | Tratamiento |
|---|---|---|
| Derivado no almacenado | `Usuario.nombre_completo` | se compone de nombres + apellidos |
| Derivado no almacenado | opción ganadora del evento | se deriva de `Resultado.marcador_local` vs `marcador_visitante` |
| Snapshot controlado | `OpcionApuesta.cuota_vigente`, `SaldoCuenta.saldo_actual`, `MovimientoSaldo.saldo_resultante`, `Liquidacion.monto_premio`, `Liquidacion.resultado_liquidacion` | se conservan y se mantienen por transacción |
