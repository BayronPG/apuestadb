# Diccionario de datos — ApuestaDB

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García
**Base:** modelo lógico normalizado en 3FN (Fases 1–4.1).
**Alcance:** 29 tablas. **No** se definen tipos de datos físicos, SQL Server, `CREATE TABLE`, índices, triggers ni procedimientos.

---

## 1. Propósito

Este diccionario documenta de forma oficial las **29 tablas** del proyecto: qué representa cada una, qué campos tiene, qué dominio de valores maneja cada campo, si es obligatorio u opcional, qué restricciones aplica y qué reglas de negocio lo gobiernan. Es el documento de referencia para construir el **modelo físico**.

## 2. Convenciones

| Término | Significado |
|---|---|
| **Dominio** | Conjunto de valores válidos del campo, expresado en lenguaje de negocio (el tipo físico se definirá en el modelo físico). |
| **Obligatorio** | El campo no admite ausencia (equivalente conceptual a "no nulo"). |
| **Opcional** | El campo admite ausencia. |
| **Restricciones** | Unicidad, rangos, integridad referencial y dependencias aplicables. |
| **PK** | Clave primaria (identificador sustituto). |
| **CK** | Clave candidata (llave natural o compuesta que también es única). |
| **FK** | Clave foránea (referencia a otra tabla). |
| **Snapshot controlado** | Valor derivado que se conserva a propósito (auditoría), mantenido por transacción. |

**Nota:** el sufijo `id_` identifica claves sustitutas. Los campos de estado usan **dominios enumerados** (valores fijos).

## 3. Mapa de documentos

| Documento | Contenido |
|---|---|
| `DICCIONARIO_DATOS.md` (este) | Índice, convenciones, resumen de tablas e inventario de claves |
| `TABLAS_DETALLADAS.md` | Ficha completa de cada una de las 29 tablas con sus campos |
| `ATRIBUTOS.md` | Catálogo de dominios y convenciones de atributos |
| `REGLAS_VALIDACION.md` | Reglas de validación, unicidad, integridad y de negocio |

---

## 4. Resumen de las 29 tablas

| # | Tabla | Descripción | Propósito | Reglas / requisitos |
|---|---|---|---|---|
| T-01 | Rol | Categoría de acceso del sistema | Clasificar permisos | RF-04, RNF-02 |
| T-02 | Usuario | Persona registrada | Identidad y credenciales | RF-01..06, RN-20 |
| T-03 | PreguntaSeguridad | Catálogo de preguntas | Recuperación segura | RF-05 |
| T-04 | RespuestaSeguridad | Respuesta del usuario a una pregunta | Verificar identidad | RF-05 |
| T-05 | TokenRecuperacion | Token temporal de restablecimiento | Restablecer contraseña | RF-05 |
| T-06 | Pais | País | Normalizar origen geográfico | RF-09 |
| T-07 | Ciudad | Ciudad | Ubicar equipos y estadios | RF-09, RF-10 |
| T-08 | Estadio | Escenario deportivo | Sede del evento | RF-10 |
| T-09 | Deporte | Disciplina deportiva | Clasificar ligas y equipos | RF-07 |
| T-10 | Liga | Torneo o competición | Organizar eventos | RF-08 |
| T-11 | Temporada | Período de una liga | Programar eventos | RF-10 |
| T-12 | Equipo | Equipo participante | Contendientes del evento | RF-09, RN-16 |
| T-13 | Arbitro | Árbitro | Dirigir eventos | RF-10 |
| T-14 | Evento | Partido | Núcleo del catálogo | RF-10/14, RN-09, RN-16 |
| T-15 | CalendarioArbitro | Designación de árbitro | Asignar árbitros | RF-10 |
| T-16 | Mercado | Tipo de apuesta del evento | Agrupar opciones | RF-11 |
| T-17 | OpcionApuesta | Resultado posible con cuota | Apostar y fijar cuota | RF-12, RN-10/11 |
| T-18 | HistorialCuota | Cambios de cuota | Historial de cuota | RN-10/11 |
| T-19 | Apuesta | Apuesta del usuario | Transacción central | RF-13..18, RN-07..15 |
| T-20 | FavoritoEquipo | Equipo favorito del usuario | Perfil del usuario | RF-06 |
| T-21 | TipoSaldo | Tipo de saldo (tokens/PSE) | Tipificar el saldo | RN-01..06 |
| T-22 | SaldoCuenta | Saldo por usuario y tipo | Validar apuestas | RN-02, RN-08 |
| T-23 | MovimientoSaldo | Débito/crédito de saldo | Trazabilidad del saldo | RF-22, RN-18/19 |
| T-24 | TipoMovimientoSaldo | Concepto de movimiento | Clasificar movimientos | RF-22 |
| T-25 | Recarga | Recarga de saldo ficticio | Ingresos de saldo | RF-21, RN-06 |
| T-26 | Resultado | Marcador oficial del evento | Liquidar apuestas | RF-23, RN-15 |
| T-27 | Liquidacion | Cierre de una apuesta | Abonar premio | RF-24/25, RN-14 |
| T-28 | Notificacion | Aviso al usuario | Comunicar hechos | RNF-06 |
| T-29 | Auditoria | Registro de operaciones | Trazabilidad | RF-29, RNF-06 |

---

## 5. Inventario de claves

| Tabla | PK | CK | FK |
|---|---|---|---|
| Rol | id_rol | nombre | — |
| Usuario | id_usuario | correo | id_rol → Rol |
| PreguntaSeguridad | id_pregunta | enunciado | — |
| RespuestaSeguridad | id_respuesta | (id_usuario, id_pregunta) | id_usuario → Usuario; id_pregunta → PreguntaSeguridad |
| TokenRecuperacion | id_token | valor_token | id_usuario → Usuario |
| Pais | id_pais | nombre; codigo | — |
| Ciudad | id_ciudad | (id_pais, nombre) | id_pais → Pais |
| Estadio | id_estadio | (id_ciudad, nombre) | id_ciudad → Ciudad |
| Deporte | id_deporte | nombre | — |
| Liga | id_liga | (id_deporte, nombre) | id_deporte → Deporte |
| Temporada | id_temporada | (id_liga, etiqueta) | id_liga → Liga |
| Equipo | id_equipo | (id_deporte, nombre) | id_deporte → Deporte; id_ciudad → Ciudad |
| Arbitro | id_arbitro | (nombres, apellidos)* | — |
| Evento | id_evento | (id_temporada, id_equipo_local, id_equipo_visitante, fecha_hora_inicio) | id_temporada → Temporada; id_equipo_local → Equipo; id_equipo_visitante → Equipo; id_estadio → Estadio |
| CalendarioArbitro | id_calendario | (id_evento, id_arbitro) | id_evento → Evento; id_arbitro → Arbitro |
| Mercado | id_mercado | (id_evento, nombre) | id_evento → Evento |
| OpcionApuesta | id_opcion | (id_mercado, etiqueta) | id_mercado → Mercado |
| HistorialCuota | id_historial | (id_opcion, fecha_hora_cambio) | id_opcion → OpcionApuesta |
| Apuesta | id_apuesta | (id_usuario, id_opcion, fecha_hora_registro)* | id_usuario → Usuario; id_opcion → OpcionApuesta; id_tipo_saldo → TipoSaldo; (id_usuario, id_tipo_saldo) → SaldoCuenta |
| FavoritoEquipo | id_favorito | (id_usuario, id_equipo) | id_usuario → Usuario; id_equipo → Equipo |
| SaldoCuenta | id_saldo_cuenta | (id_usuario, id_tipo_saldo) | id_usuario → Usuario; id_tipo_saldo → TipoSaldo |
| MovimientoSaldo | id_movimiento | (id_saldo_cuenta, fecha_hora, id_tipo_movimiento) | id_saldo_cuenta → SaldoCuenta; id_tipo_movimiento → TipoMovimientoSaldo; id_apuesta → Apuesta; id_recarga → Recarga |
| TipoSaldo | id_tipo_saldo | nombre | — |
| TipoMovimientoSaldo | id_tipo_movimiento | nombre | — |
| Recarga | id_recarga | (id_usuario, id_tipo_saldo, fecha_hora)* | id_usuario → Usuario; id_tipo_saldo → TipoSaldo |
| Resultado | id_resultado | id_evento | id_evento → Evento |
| Liquidacion | id_liquidacion | id_apuesta | id_apuesta → Apuesta; id_resultado → Resultado |
| Notificacion | id_notificacion | — | id_usuario → Usuario |
| Auditoria | id_auditoria | — | id_usuario → Usuario (opcional) |

`*` Clave candidata **cuasi-única**: a validar con datos reales.

**Observaciones de claves:**
- **PK sustitutas** en todas las tablas; las **CK naturales** conservan la unicidad del negocio.
- **FK compuesta:** `Apuesta (id_usuario, id_tipo_saldo) → SaldoCuenta`.
- **FK opcionales:** `MovimientoSaldo.id_apuesta`, `MovimientoSaldo.id_recarga`, `Auditoria.id_usuario`.
- **Unicidad 1:1:** `Resultado.id_evento` y `Liquidacion.id_apuesta` son únicos.

---

## 6. Dependencias y derivaciones

- **Relaciones 1:N:** resueltas por FK en el lado "muchos" (ver `docs/ACTUAL/modelo_logico/RELACIONES_LOGICAS.md`).
- **Relaciones 1:1:** Evento–Resultado y Apuesta–Liquidacion (FK única).
- **Relaciones N:M:** resueltas por RespuestaSeguridad, CalendarioArbitro, FavoritoEquipo, SaldoCuenta y Liquidacion.
- **Snapshots controlados:** `OpcionApuesta.cuota_vigente`, `SaldoCuenta.saldo_actual`, `MovimientoSaldo.saldo_resultante`, `Liquidacion.monto_premio`, `Liquidacion.resultado_liquidacion`.
- **Derivados no almacenados:** `Usuario.nombre_completo`, opción ganadora de `Resultado` (derivada del marcador).
