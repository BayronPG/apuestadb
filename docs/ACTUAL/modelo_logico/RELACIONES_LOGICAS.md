# Relaciones lógicas — ApuestaDB (Modelo Lógico · Fase 3)

**Fuente:** modelo conceptual aprobado. **Nivel:** lógico relacional. Sin SQL ni tipos de datos.
> Este documento resuelve **todas** las relaciones del modelo conceptual (1:1, 1:N y N:M) y justifica cada decisión.

---

## 1. Reglas de transformación aplicadas

1. **1:N** → se agrega una **clave foránea (FK)** en el lado "muchos" (la tabla que depende).
2. **1:1** → se agrega una **FK única** en el lado de **participación parcial** (el que aparece o se registra después), para evitar valores vacíos innecesarios.
3. **N:M** → se crea una **tabla asociativa** con clave propia y **clave candidata compuesta** (par de FKs), donde viven los atributos de la relación.
4. **Entidad débil** → conserva su tabla y su vínculo obligatorio con la entidad propietaria mediante **FK**.

---

## 2. Relaciones 1:N resueltas (FK en el lado muchos)

| Relación | FK resultante | Justificación |
|---|---|---|
| Rol–Usuario | `Usuario.id_rol` → **Rol** | cada usuario tiene exactamente un rol |
| Usuario–RespuestaSeguridad | `RespuestaSeguridad.id_usuario` → **Usuario** | la respuesta pertenece a un usuario |
| PreguntaSeguridad–RespuestaSeguridad | `RespuestaSeguridad.id_pregunta` → **PreguntaSeguridad** | la respuesta responde una pregunta |
| Usuario–TokenRecuperacion | `TokenRecuperacion.id_usuario` → **Usuario** | el token pertenece a un usuario |
| Pais–Ciudad | `Ciudad.id_pais` → **Pais** | la ciudad pertenece a un país |
| Ciudad–Estadio | `Estadio.id_ciudad` → **Ciudad** | el estadio está en una ciudad |
| Ciudad–Equipo | `Equipo.id_ciudad` → **Ciudad** | el equipo se origina en una ciudad |
| Deporte–Liga | `Liga.id_deporte` → **Deporte** | la liga pertenece a un deporte |
| Deporte–Equipo | `Equipo.id_deporte` → **Deporte** | el equipo practica un deporte |
| Liga–Temporada | `Temporada.id_liga` → **Liga** | la temporada pertenece a una liga |
| Temporada–Evento | `Evento.id_temporada` → **Temporada** | el evento se juega en una temporada |
| Equipo–Evento (local) | `Evento.id_equipo_local` → **Equipo** | el evento tiene un equipo local |
| Equipo–Evento (visitante) | `Evento.id_equipo_visitante` → **Equipo** | el evento tiene un equipo visitante |
| Estadio–Evento | `Evento.id_estadio` → **Estadio** | el evento tiene una sede |
| Evento–CalendarioArbitro | `CalendarioArbitro.id_evento` → **Evento** | la designación pertenece a un evento |
| Arbitro–CalendarioArbitro | `CalendarioArbitro.id_arbitro` → **Arbitro** | la designación asigna un árbitro |
| Evento–Mercado | `Mercado.id_evento` → **Evento** | el mercado se ofrece sobre un evento |
| Mercado–OpcionApuesta | `OpcionApuesta.id_mercado` → **Mercado** | la opción pertenece a un mercado |
| OpcionApuesta–HistorialCuota | `HistorialCuota.id_opcion` → **OpcionApuesta** | el registro de cuota pertenece a una opción |
| Usuario–Apuesta | `Apuesta.id_usuario` → **Usuario** | la apuesta la realiza un usuario |
| OpcionApuesta–Apuesta | `Apuesta.id_opcion` → **OpcionApuesta** | la apuesta selecciona una opción |
| TipoSaldo–Apuesta | `Apuesta.id_tipo_saldo` → **TipoSaldo** | la apuesta se paga con un solo tipo de saldo |
| Usuario–FavoritoEquipo | `FavoritoEquipo.id_usuario` → **Usuario** | el favorito pertenece a un usuario |
| Equipo–FavoritoEquipo | `FavoritoEquipo.id_equipo` → **Equipo** | el favorito referencia un equipo |
| Usuario–SaldoCuenta | `SaldoCuenta.id_usuario` → **Usuario** | la cuenta de saldo pertenece a un usuario |
| TipoSaldo–SaldoCuenta | `SaldoCuenta.id_tipo_saldo` → **TipoSaldo** | la cuenta corresponde a un tipo de saldo |
| SaldoCuenta–MovimientoSaldo | `MovimientoSaldo.id_saldo_cuenta` → **SaldoCuenta** | el movimiento afecta una cuenta |
| TipoMovimientoSaldo–MovimientoSaldo | `MovimientoSaldo.id_tipo_movimiento` → **TipoMovimientoSaldo** | el movimiento tiene un concepto |
| Apuesta–MovimientoSaldo *(opcional)* | `MovimientoSaldo.id_apuesta` → **Apuesta** | el movimiento puede originarse en una apuesta |
| Recarga–MovimientoSaldo *(opcional)* | `MovimientoSaldo.id_recarga` → **Recarga** | el movimiento puede originarse en una recarga |
| Usuario–Recarga | `Recarga.id_usuario` → **Usuario** | la recarga beneficia a un usuario |
| TipoSaldo–Recarga | `Recarga.id_tipo_saldo` → **TipoSaldo** | la recarga aplica a un tipo de saldo |
| Resultado–Liquidacion | `Liquidacion.id_resultado` → **Resultado** | la liquidación depende de un resultado |
| Usuario–Notificacion | `Notificacion.id_usuario` → **Usuario** | la notificación se dirige a un usuario |
| Usuario–Auditoria *(opcional)* | `Auditoria.id_usuario` → **Usuario** | el registro puede asociarse a un usuario |

**FK compuesta adicional:** `Apuesta (id_usuario, id_tipo_saldo)` → **SaldoCuenta** `(id_usuario, id_tipo_saldo)`, para garantizar que la cuenta afectada existe y corresponde al usuario y al tipo indicados.

---

## 3. Relaciones 1:1 resueltas

### 3.1 Evento–Resultado
- **Resolución:** tabla **Resultado** con FK **única** `id_evento` → Evento.
- **Justificación:** el resultado se registra **después** de que el evento finaliza (participación parcial). Separarlo evita dejar vacíos en los eventos aún no jugados y mantiene el catálogo del evento estable.
- **Alternativa descartada:** almacenar el resultado dentro de Evento (obligaría a columnas vacías y acoplaría dos momentos distintos del negocio).

### 3.2 Apuesta–Liquidacion
- **Resolución:** tabla **Liquidacion** con FK **única** `id_apuesta` → Apuesta.
- **Justificación:** la liquidación ocurre **después** y **una sola vez** por apuesta (RN-14). La unicidad de `id_apuesta` garantiza "una apuesta, una liquidación".
- **Alternativa descartada:** guardar el estado y el premio dentro de Apuesta (perdería la fecha y el detalle del cierre, y dificultaría auditar la liquidación).

---

## 4. Relaciones N:M resueltas por tablas asociativas

| Relación N:M | Tabla asociativa | Clave candidata | Atributos de la relación |
|---|---|---|---|
| Usuario ↔ PreguntaSeguridad | **RespuestaSeguridad** | (`id_usuario`, `id_pregunta`) | respuesta, fecha_registro |
| Evento ↔ Arbitro | **CalendarioArbitro** | (`id_evento`, `id_arbitro`) | rol_arbitro, fecha_designacion |
| Usuario ↔ Equipo | **FavoritoEquipo** | (`id_usuario`, `id_equipo`) | fecha_marcado |
| Usuario ↔ TipoSaldo | **SaldoCuenta** | (`id_usuario`, `id_tipo_saldo`) | saldo_actual, fecha_ultima_actualizacion |
| Apuesta ↔ Resultado | **Liquidacion** | `id_apuesta` (único) | resultado_liquidacion, monto_premio, fecha_hora |

**Justificación general:** toda relación de muchos a muchos se materializa en una tabla con clave propia y clave candidata compuesta, de modo que los atributos de la relación (respuesta, rol, fecha, saldo, premio) queden correctamente ubicados y se evite repetir información.

---

## 5. Resumen

- **Relaciones 1:N resueltas con FK:** 35.
- **Relaciones 1:1 resueltas con FK única:** 2 (Evento–Resultado, Apuesta–Liquidacion).
- **Relaciones N:M resueltas por tabla asociativa:** 5.
- **FK compuesta:** 1 (`Apuesta` → `SaldoCuenta`).
- **Tablas con participación parcial (FK opcional):** MovimientoSaldo (hacia Apuesta y Recarga), Auditoria (hacia Usuario).

---

## 6. Revisión Fase 4.1

Las correcciones de normalización **no modificaron ninguna clave foránea**: `MovimientoSaldo.clase_movimiento` y `Resultado.opcion_ganadora` no eran FK. Las relaciones 1:1, 1:N y N:M descritas en este documento **se mantienen vigentes**.
