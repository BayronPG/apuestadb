# Estrategia de índices — ApuestaDB (SQL Server · Fase 6)

**Base:** modelo físico (Fases 1–5). Diseño, sin script SQL.
> Objetivo: cubrir los accesos reales del negocio sin sobre-indexar. En SQL Server **las columnas FK no se indexan automáticamente**, por lo que se declaran explícitamente.

---

## 1. Criterios generales

1. **Un índice clustered por tabla**, sobre la PK (identidad ascendente → inserciones secuenciales, sin fragmentación por página).
2. **Un índice non-clustered por cada FK** usada en joins o filtros (evita escaneos en las tablas hijas).
3. **Índices únicos** derivados de las restricciones `UNIQUE` (claves candidatas).
4. **Índices de consulta** para los accesos frecuentes (eventos por estado/fecha, apuestas por usuario/estado).
5. **Evitar redundancia**: no crear dos índices con el mismo prefijo de columnas.
6. **Fill factor** alto (95–100) en tablas de inserción secuencial; menor en tablas con actualizaciones intensas.

## 2. Índices clustered

| Tabla | Clustered | Columnas |
|---|---|---|
| Las 29 tablas | PK clustered | `id_<entidad>` |

**Nota:** en `MovimientoSaldo` y `HistorialCuota` el clustered sobre la identidad es correcto (append-only). Si en el futuro el acceso dominante fuera "por cuenta/opción en un rango de fechas", se podría reevaluar.

## 3. Índices non-clustered

| Índice | Tabla | Columna(s) | Justificación |
|---|---|---|---|
| IX_Usuario_Rol | Usuario | id_rol | joins y filtros por rol |
| IX_Respuesta_Usuario | RespuestaSeguridad | id_usuario | recuperación por usuario |
| IX_Respuesta_Pregunta | RespuestaSeguridad | id_pregunta | integridad y filtros por pregunta |
| IX_Token_Usuario | TokenRecuperacion | id_usuario | tokens por usuario |
| IX_Ciudad_Pais | Ciudad | id_pais | ciudades por país |
| IX_Estadio_Ciudad | Estadio | id_ciudad | estadios por ciudad |
| IX_Equipo_Deporte | Equipo | id_deporte | equipos por deporte |
| IX_Equipo_Ciudad | Equipo | id_ciudad | equipos por ciudad |
| IX_Liga_Deporte | Liga | id_deporte | ligas por deporte |
| IX_Temporada_Liga | Temporada | id_liga | temporadas por liga |
| IX_Evento_Temporada | Evento | id_temporada | eventos por temporada |
| IX_Evento_Estado_Fecha | Evento | (estado, fecha_hora_inicio) | listado de eventos vigentes/próximos |
| IX_Evento_EquipoLocal | Evento | id_equipo_local | calendario por equipo |
| IX_Evento_EquipoVisitante | Evento | id_equipo_visitante | calendario por equipo |
| IX_Evento_Estadio | Evento | id_estadio | eventos por sede |
| IX_Calendario_Evento | CalendarioArbitro | id_evento | designaciones por evento |
| IX_Calendario_Arbitro | CalendarioArbitro | id_arbitro | designaciones por árbitro |
| IX_Mercado_Evento | Mercado | id_evento | mercados por evento |
| IX_Opcion_Mercado | OpcionApuesta | id_mercado | opciones por mercado |
| IX_Historial_Opcion | HistorialCuota | (id_opcion, fecha_hora_cambio DESC) | última cuota de una opción |
| IX_Apuesta_Usuario | Apuesta | (id_usuario, estado) | historial de apuestas del usuario |
| IX_Apuesta_Opcion | Apuesta | id_opcion | apuestas por opción (liquidación) |
| IX_Apuesta_TipoSaldo | Apuesta | id_tipo_saldo | filtros por tipo de saldo |
| IX_Favorito_Usuario | FavoritoEquipo | id_usuario | favoritos por usuario |
| IX_Favorito_Equipo | FavoritoEquipo | id_equipo | seguidores por equipo |
| IX_SaldoCuenta_Usuario | SaldoCuenta | id_usuario | saldos del usuario |
| IX_SaldoCuenta_TipoSaldo | SaldoCuenta | id_tipo_saldo | saldos por tipo |
| IX_Movimiento_SaldoCuenta | MovimientoSaldo | (id_saldo_cuenta, fecha_hora DESC) | extracto de movimientos |
| IX_Movimiento_TipoMovimiento | MovimientoSaldo | id_tipo_movimiento | filtros por concepto |
| IX_Movimiento_Apuesta | MovimientoSaldo | id_apuesta | vínculo movimiento–apuesta |
| IX_Movimiento_Recarga | MovimientoSaldo | id_recarga | vínculo movimiento–recarga |
| IX_Recarga_Usuario | Recarga | (id_usuario, fecha_hora DESC) | recargas del usuario |
| IX_Recarga_TipoSaldo | Recarga | id_tipo_saldo | recargas por tipo |
| IX_Liquidacion_Resultado | Liquidacion | id_resultado | liquidaciones por resultado |
| IX_Notificacion_Usuario | Notificacion | (id_usuario, estado) | no leídas por usuario |
| IX_Auditoria_Usuario | Auditoria | id_usuario | auditoría por usuario |
| IX_Auditoria_Fecha | Auditoria | fecha_hora DESC | auditoría reciente |
| IX_Auditoria_Entidad | Auditoria | entidad_afectada | auditoría por tipo de entidad |

**Índices únicos:** los generados por las 23+ restricciones `UNIQUE` de `CLAVES_Y_RESTRICCIONES.md` (incluyen `UQ_Resultado` y `UQ_Liquidacion`, que materializan las relaciones 1:1).

## 4. Índices filtrados y covering

| Índice | Tabla | Definición | Motivo |
|---|---|---|---|
| UX_Usuario_telefono | Usuario | UNIQUE (telefono) WHERE telefono IS NOT NULL | único con nulos permitidos; solo indexa valores presentes |
| IX_Evento_Estado_Fecha | Evento | (estado, fecha_hora_inicio) INCLUDE (id_estadio, id_equipo_local, id_equipo_visitante) | listado de eventos apostables (covering) |
| IX_Apuesta_Usuario | Apuesta | (id_usuario, estado) INCLUDE (monto, cuota_congelada, fecha_hora_registro) | historial de apuestas del usuario (covering) |
| IX_Apuesta_OpcionEstado | Apuesta | (id_opcion, estado) | liquidación (apuestas pendientes de una opción) |
| IX_Notificacion_Usuario | Notificacion | (id_usuario, estado) | bandeja de avisos del usuario |

**Nota (Fase 6.1):** los índices filtrados previstos en el diseño inicial (`IX_Evento_Vigentes`, `IX_Apuesta_Pendientes`, `IX_Notificacion_NoLeidas`) se reemplazaron por los índices compuestos de la tabla anterior, que cubren los mismos accesos y además soportan las FK. El filtrado se conserva solo donde es imprescindible (`UX_Usuario_telefono`).

## 5. Mantenimiento

- **Estadísticas:** automáticas (`AUTO_CREATE_STATISTICS`/`AUTO_UPDATE_STATISTICS` en ON).
- **Fragmentación:** `REORGANIZE` entre 5 % y 30 %; `REBUILD` por encima de 30 % (o con `ONLINE = ON` si la edición lo permite).
- **Diagnóstico:** vistas de administración dinámica (DMV) para detectar índices no usados (`sys.dm_db_index_usage_stats`) y faltantes (`sys.dm_db_missing_index_details`).
- **Evitar:** duplicar índices con el mismo prefijo; indexar columnas de baja selectividad de forma aislada (p. ej., un índice solo por `estado`).

## 6. Resumen

- **29 índices clustered** (uno por tabla, sobre la PK).
- **26 índices únicos** (de las restricciones `UNIQUE`; incluyen las de 1:1).
- **26 índices non-clustered** (25 de apoyo a FK/consultas + 1 único filtrado).
- **2 covering** (`IX_Apuesta_Usuario`, `IX_Evento_Estado_Fecha`).
- **Total: 81 objetos de índice.**
