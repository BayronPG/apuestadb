# Tablas relacionales — ApuestaDB (Modelo Lógico · Fase 3)

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Fuente:** modelo conceptual aprobado (`docs/ACTUAL/modelo_conceptual/`).
**Nivel:** lógico relacional. **Sin** SQL, tipos de datos, índices, triggers ni procedimientos.

> Convención de claves: **PK** = clave primaria propuesta · **CK** = clave candidata.
> Los identificadores se nombran con el prefijo `id_`; no se definen todavía sus tipos de datos.
> **Fase 4.1:** se aplicaron las correcciones C-1 y C-2 (eliminados `MovimientoSaldo.clase_movimiento` y `Resultado.opcion_ganadora`); las 29 tablas alcanzan 3FN.

---

## Resumen: 29 tablas

| Origen | Cantidad | Tablas |
|---|---|---|
| Entidades fuertes | 20 | Rol, Usuario, PreguntaSeguridad, Pais, Ciudad, Estadio, Deporte, Liga, Temporada, Equipo, Arbitro, Evento, Mercado, OpcionApuesta, Apuesta, TipoSaldo, TipoMovimientoSaldo, Recarga, Resultado, Auditoria |
| Entidades asociativas | 5 | RespuestaSeguridad, CalendarioArbitro, FavoritoEquipo, SaldoCuenta, Liquidacion |
| Entidades dependientes (débiles) | 4 | TokenRecuperacion, HistorialCuota, MovimientoSaldo, Notificacion |

---

## Dominio 1 — Seguridad y usuarios

### T-01 · Rol
- **Propósito:** catalogar los tipos de acceso del sistema (usuario, administrador).
- **Justificación:** RF-04 y RNF-02 exigen control de acceso por roles.
- **Atributos:** `id_rol`, `nombre`, `descripcion`, `estado`.
- **PK propuesta:** `id_rol`.
- **CK:** `nombre` (único).
- **Relaciones esperadas:** 1:N con Usuario.

### T-02 · Usuario
- **Propósito:** registrar la identidad, credenciales y estado de cada persona.
- **Justificación:** RF-01..RF-06, RN-20; es el actor principal (ACT-02/ACT-03).
- **Atributos:** `id_usuario`, `nombres`, `apellidos`, `correo`, `contrasena`, `telefono`, `estado`, `fecha_registro`, `id_rol`.
- **PK propuesta:** `id_usuario`.
- **CK:** `correo` (único).
- **Relaciones esperadas:** N:1 con Rol; 1:N con RespuestaSeguridad, TokenRecuperacion, FavoritoEquipo, SaldoCuenta, Recarga, Apuesta, Notificacion y Auditoria.

### T-03 · PreguntaSeguridad
- **Propósito:** catalogar las preguntas usadas en la recuperación de contraseña.
- **Justificación:** RF-05 (recuperación segura).
- **Atributos:** `id_pregunta`, `enunciado`, `estado`.
- **PK propuesta:** `id_pregunta`.
- **CK:** `enunciado` (único).
- **Relaciones esperadas:** 1:N con RespuestaSeguridad.

### T-04 · RespuestaSeguridad *(asociativa)*
- **Propósito:** almacenar la respuesta de un usuario a una pregunta de seguridad.
- **Justificación:** RF-05; resuelve la relación N:M Usuario ↔ PreguntaSeguridad.
- **Atributos:** `id_respuesta`, `id_usuario`, `id_pregunta`, `respuesta`, `fecha_registro`.
- **PK propuesta:** `id_respuesta`.
- **CK:** (`id_usuario`, `id_pregunta`) — un usuario no repite la misma pregunta.
- **Relaciones esperadas:** N:1 con Usuario y N:1 con PreguntaSeguridad.

### T-05 · TokenRecuperacion
- **Propósito:** gestionar los tokens temporales de restablecimiento de contraseña.
- **Justificación:** RF-05; no existe sin el usuario que lo solicita.
- **Atributos:** `id_token`, `id_usuario`, `valor_token`, `fecha_emision`, `fecha_expiracion`, `estado`.
- **PK propuesta:** `id_token`.
- **CK:** `valor_token` (único).
- **Relaciones esperadas:** N:1 con Usuario.

---

## Dominio 2 — Catálogo deportivo

### T-06 · Pais
- **Propósito:** catalogar países de origen de ciudades y equipos.
- **Justificación:** normaliza el origen geográfico (entidad de apoyo del catálogo).
- **Atributos:** `id_pais`, `nombre`, `codigo`.
- **PK propuesta:** `id_pais`.
- **CK:** `nombre` (único); `codigo` (único).
- **Relaciones esperadas:** 1:N con Ciudad.

### T-07 · Ciudad
- **Propósito:** catalogar ciudades donde se ubican equipos y estadios.
- **Justificación:** ubica geográficamente equipos y escenarios.
- **Atributos:** `id_ciudad`, `id_pais`, `nombre`, `region`.
- **PK propuesta:** `id_ciudad`.
- **CK:** (`id_pais`, `nombre`).
- **Relaciones esperadas:** N:1 con Pais; 1:N con Estadio y Equipo.

### T-08 · Estadio
- **Propósito:** catalogar los escenarios donde se disputan los eventos.
- **Justificación:** RF-10 (el evento tiene sede).
- **Atributos:** `id_estadio`, `id_ciudad`, `nombre`, `capacidad`, `direccion`.
- **PK propuesta:** `id_estadio`.
- **CK:** (`id_ciudad`, `nombre`).
- **Relaciones esperadas:** N:1 con Ciudad; 1:N con Evento.

### T-09 · Deporte
- **Propósito:** catalogar las disciplinas deportivas (inicial: fútbol).
- **Justificación:** RF-07; clasifica ligas y equipos.
- **Atributos:** `id_deporte`, `nombre`, `descripcion`, `estado`.
- **PK propuesta:** `id_deporte`.
- **CK:** `nombre` (único).
- **Relaciones esperadas:** 1:N con Liga y Equipo.

### T-10 · Liga
- **Propósito:** catalogar torneos o competiciones.
- **Justificación:** RF-08; organiza los eventos por competencia.
- **Atributos:** `id_liga`, `id_deporte`, `nombre`, `categoria`, `estado`.
- **PK propuesta:** `id_liga`.
- **CK:** (`id_deporte`, `nombre`).
- **Relaciones esperadas:** N:1 con Deporte; 1:N con Temporada.

### T-11 · Temporada
- **Propósito:** delimitar el período en que se disputa una liga.
- **Justificación:** RF-10 (programación de eventos por temporada).
- **Atributos:** `id_temporada`, `id_liga`, `etiqueta`, `fecha_inicio`, `fecha_fin`, `estado`.
- **PK propuesta:** `id_temporada`.
- **CK:** (`id_liga`, `etiqueta`).
- **Relaciones esperadas:** N:1 con Liga; 1:N con Evento.

### T-12 · Equipo
- **Propósito:** catalogar los equipos que participan en los eventos.
- **Justificación:** RF-09, RN-16.
- **Atributos:** `id_equipo`, `id_deporte`, `id_ciudad`, `nombre`, `siglas`, `fecha_fundacion`, `estado`.
- **PK propuesta:** `id_equipo`.
- **CK:** (`id_deporte`, `nombre`).
- **Relaciones esperadas:** N:1 con Deporte y Ciudad; 1:N con Evento (local y visitante) y FavoritoEquipo.

### T-13 · Arbitro
- **Propósito:** catalogar los árbitros que dirigen los eventos.
- **Justificación:** conformación oficial del evento (RF-10).
- **Atributos:** `id_arbitro`, `nombres`, `apellidos`, `categoria`, `estado`.
- **PK propuesta:** `id_arbitro`.
- **CK:** (`nombres`, `apellidos`) — cuasi-candidata, sujeta a validación.
- **Relaciones esperadas:** 1:N con CalendarioArbitro.

### T-14 · Evento
- **Propósito:** registrar cada encuentro deportivo (equipos, fecha, sede y estado).
- **Justificación:** RF-10, RF-14, RN-09, RN-16; núcleo del catálogo.
- **Atributos:** `id_evento`, `id_temporada`, `id_equipo_local`, `id_equipo_visitante`, `id_estadio`, `fecha_hora_inicio`, `estado`, `descripcion`.
- **PK propuesta:** `id_evento`.
- **CK:** (`id_temporada`, `id_equipo_local`, `id_equipo_visitante`, `fecha_hora_inicio`).
- **Relaciones esperadas:** N:1 con Temporada, Equipo (local), Equipo (visitante) y Estadio; 1:N con Mercado y CalendarioArbitro; 1:1 con Resultado.

### T-15 · CalendarioArbitro *(asociativa)*
- **Propósito:** asignar árbitros a los eventos y su rol en cada uno.
- **Justificación:** resuelve la relación N:M Evento ↔ Arbitro.
- **Atributos:** `id_calendario`, `id_evento`, `id_arbitro`, `rol_arbitro`, `fecha_designacion`.
- **PK propuesta:** `id_calendario`.
- **CK:** (`id_evento`, `id_arbitro`).
- **Relaciones esperadas:** N:1 con Evento y con Arbitro.

### T-16 · Mercado
- **Propósito:** definir los tipos de apuesta ofrecidos sobre un evento.
- **Justificación:** RF-11; agrupa las opciones apostables.
- **Atributos:** `id_mercado`, `id_evento`, `nombre`, `descripcion`, `fecha_apertura`, `fecha_cierre`, `estado`.
- **PK propuesta:** `id_mercado`.
- **CK:** (`id_evento`, `nombre`).
- **Relaciones esperadas:** N:1 con Evento; 1:N con OpcionApuesta.

### T-17 · OpcionApuesta
- **Propósito:** representar cada resultado posible dentro de un mercado, con su cuota vigente.
- **Justificación:** RF-12, RN-10/RN-11.
- **Atributos:** `id_opcion`, `id_mercado`, `etiqueta`, `cuota_vigente`, `estado`.
- **PK propuesta:** `id_opcion`.
- **CK:** (`id_mercado`, `etiqueta`).
- **Relaciones esperadas:** N:1 con Mercado; 1:N con HistorialCuota y Apuesta.

### T-18 · HistorialCuota
- **Propósito:** conservar la evolución de la cuota de cada opción.
- **Justificación:** RN-10/RN-11 (permite verificar la cuota ofrecida en cada momento).
- **Atributos:** `id_historial`, `id_opcion`, `valor_cuota`, `fecha_hora_cambio`, `motivo`.
- **PK propuesta:** `id_historial`.
- **CK:** (`id_opcion`, `fecha_hora_cambio`).
- **Relaciones esperadas:** N:1 con OpcionApuesta.

---

## Dominio 3 — Apuestas

### T-19 · Apuesta
- **Propósito:** registrar la apuesta simple de un usuario, con monto y cuota congelada.
- **Justificación:** RF-13..RF-18, RN-07..RN-15; entidad transaccional central.
- **Atributos:** `id_apuesta`, `id_usuario`, `id_opcion`, `id_tipo_saldo`, `monto`, `cuota_congelada`, `tipo_apuesta`, `estado`, `fecha_hora_registro`.
- **PK propuesta:** `id_apuesta`.
- **CK:** (`id_usuario`, `id_opcion`, `fecha_hora_registro`) — cuasi-candidata.
- **Relaciones esperadas:** N:1 con Usuario, OpcionApuesta y TipoSaldo; 1:1 con Liquidacion. El par (`id_usuario`, `id_tipo_saldo`) referencia la cuenta de saldo (T-22) que se afecta.

### T-20 · FavoritoEquipo *(asociativa)*
- **Propósito:** registrar los equipos favoritos de cada usuario.
- **Justificación:** resuelve la relación N:M Usuario ↔ Equipo (apoyo al perfil, RF-06).
- **Atributos:** `id_favorito`, `id_usuario`, `id_equipo`, `fecha_marcado`.
- **PK propuesta:** `id_favorito`.
- **CK:** (`id_usuario`, `id_equipo`).
- **Relaciones esperadas:** N:1 con Usuario y con Equipo.

---

## Dominio 4 — Saldo ficticio

### T-21 · TipoSaldo
- **Propósito:** catalogar los tipos de saldo ficticio (tokens y PSE).
- **Justificación:** RN-01..RN-06.
- **Atributos:** `id_tipo_saldo`, `nombre`, `descripcion`, `estado`.
- **PK propuesta:** `id_tipo_saldo`.
- **CK:** `nombre` (único).
- **Relaciones esperadas:** 1:N con SaldoCuenta, Recarga y Apuesta.

### T-22 · SaldoCuenta *(asociativa)*
- **Propósito:** mantener el saldo disponible de un usuario para un tipo de saldo.
- **Justificación:** RN-02, RN-08; base de las validaciones de apuesta.
- **Atributos:** `id_saldo_cuenta`, `id_usuario`, `id_tipo_saldo`, `saldo_actual`, `fecha_ultima_actualizacion`.
- **PK propuesta:** `id_saldo_cuenta`.
- **CK:** (`id_usuario`, `id_tipo_saldo`) — una cuenta por usuario y tipo.
- **Relaciones esperadas:** N:1 con Usuario y TipoSaldo; 1:N con MovimientoSaldo.

### T-23 · MovimientoSaldo
- **Propósito:** dejar trazabilidad de cada débito o crédito aplicado a un saldo.
- **Justificación:** RF-22, RN-18/RN-19.
- **Atributos:** `id_movimiento`, `id_saldo_cuenta`, `id_tipo_movimiento`, `id_apuesta`, `id_recarga`, `monto`, `saldo_resultante`, `fecha_hora`, `referencia`. *(Fase 4.1: se eliminó `clase_movimiento`, derivable de TipoMovimientoSaldo.naturaleza.)*
- **PK propuesta:** `id_movimiento`.
- **CK:** (`id_saldo_cuenta`, `fecha_hora`, `id_tipo_movimiento`).
- **Relaciones esperadas:** N:1 con SaldoCuenta y TipoMovimientoSaldo; referencia opcional a Apuesta y Recarga.

### T-24 · TipoMovimientoSaldo
- **Propósito:** catalogar los conceptos de movimiento (apuesta, premio, recarga, ajuste).
- **Justificación:** RF-22, RN-18 (clasificar el motivo).
- **Atributos:** `id_tipo_movimiento`, `nombre`, `naturaleza`, `descripcion`.
- **PK propuesta:** `id_tipo_movimiento`.
- **CK:** `nombre` (único).
- **Relaciones esperadas:** 1:N con MovimientoSaldo.

### T-25 · Recarga
- **Propósito:** documentar los ingresos de saldo ficticio realizados por el administrador.
- **Justificación:** RF-21, RN-06.
- **Atributos:** `id_recarga`, `id_usuario`, `id_tipo_saldo`, `monto`, `fecha_hora`, `estado`, `observacion`.
- **PK propuesta:** `id_recarga`.
- **CK:** (`id_usuario`, `id_tipo_saldo`, `fecha_hora`) — cuasi-candidata.
- **Relaciones esperadas:** N:1 con Usuario y TipoSaldo; 1:N con MovimientoSaldo.

---

## Dominio 5 — Resultados y liquidación

### T-26 · Resultado
- **Propósito:** registrar el resultado oficial de un evento.
- **Justificación:** RF-23, RN-15; fuente de verdad para liquidar.
- **Atributos:** `id_resultado`, `id_evento`, `marcador_local`, `marcador_visitante`, `fecha_registro`, `estado`. *(Fase 4.1: se eliminó `opcion_ganadora`; la opción ganadora se deriva del marcador.)*
- **PK propuesta:** `id_resultado`.
- **CK:** `id_evento` (único) — un solo resultado por evento.
- **Relaciones esperadas:** 1:1 con Evento; 1:N con Liquidacion.

### T-27 · Liquidacion *(asociativa)*
- **Propósito:** cerrar cada apuesta según el resultado y registrar el premio.
- **Justificación:** RF-24, RF-25, RN-14/RN-15.
- **Atributos:** `id_liquidacion`, `id_apuesta`, `id_resultado`, `resultado_liquidacion`, `monto_premio`, `fecha_hora`, `estado`.
- **PK propuesta:** `id_liquidacion`.
- **CK:** `id_apuesta` (único) — una apuesta se liquida una sola vez.
- **Relaciones esperadas:** N:1 con Apuesta y Resultado.

---

## Dominio 6 — Auditoría y soporte

### T-28 · Notificacion
- **Propósito:** informar al usuario de hechos relevantes de su cuenta o sus apuestas.
- **Justificación:** RNF-06; apoyo a la comunicación del sistema.
- **Atributos:** `id_notificacion`, `id_usuario`, `mensaje`, `tipo`, `fecha_hora`, `estado`.
- **PK propuesta:** `id_notificacion`.
- **CK:** — (no requiere clave natural).
- **Relaciones esperadas:** N:1 con Usuario.

### T-29 · Auditoria
- **Propósito:** conservar la trazabilidad de las operaciones importantes.
- **Justificación:** RF-29, RNF-06.
- **Atributos:** `id_auditoria`, `id_usuario`, `operacion`, `entidad_afectada`, `descripcion`, `fecha_hora`, `resultado`, `direccion_origen`.
- **PK propuesta:** `id_auditoria`.
- **CK:** — (no requiere clave natural).
- **Relaciones esperadas:** N:1 con Usuario (opcional, por operaciones del sistema).
