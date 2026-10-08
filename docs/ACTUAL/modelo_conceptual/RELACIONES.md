# Relaciones del negocio — ApuestaDB (Modelo Conceptual · Fase 2)

**Fuente exclusiva:** Fase 1 (`docs/ACTUAL/requisitos/`). **Nivel:** conceptual.
> Este documento responde a la tarea 3: identificar todas las relaciones entre entidades.
> Tipos usados: **1:1** (uno a uno) · **1:N** (uno a muchos) · **N:M** (muchos a muchos, siempre resuelta por una entidad asociativa).

---

## Tabla de relaciones

| ID | Relación | Entidades | Verbo (lectura) | Tipo | Clasificación |
|---|---|---|---|---|---|
| R-01 | Usuario–Rol | Rol ↔ Usuario | un rol clasifica a muchos usuarios | 1:N | CONFIRMADO |
| R-02 | Usuario–RespuestaSeguridad | Usuario ↔ RespuestaSeguridad | un usuario configura varias respuestas | 1:N | PROPUESTA |
| R-03 | Pregunta–RespuestaSeguridad | PreguntaSeguridad ↔ RespuestaSeguridad | una pregunta es respondida por varios usuarios | 1:N | PROPUESTA |
| R-04 | Usuario–TokenRecuperacion | Usuario ↔ TokenRecuperacion | un usuario solicita varios tokens | 1:N | PROPUESTA |
| R-05 | Pais–Ciudad | Pais ↔ Ciudad | un país contiene varias ciudades | 1:N | PROPUESTA |
| R-06 | Ciudad–Estadio | Ciudad ↔ Estadio | una ciudad alberga varios estadios | 1:N | PROPUESTA |
| R-07 | Ciudad–Equipo | Ciudad ↔ Equipo | una ciudad origina varios equipos | 1:N | PROPUESTA |
| R-08 | Deporte–Liga | Deporte ↔ Liga | un deporte agrupa varias ligas | 1:N | PROPUESTA |
| R-09 | Deporte–Equipo | Deporte ↔ Equipo | un deporte agrupa varios equipos | 1:N | PROPUESTA |
| R-10 | Liga–Temporada | Liga ↔ Temporada | una liga programa varias temporadas | 1:N | PROPUESTA |
| R-11 | Temporada–Evento | Temporada ↔ Evento | una temporada incluye varios eventos | 1:N | PROPUESTA |
| R-12 | Equipo–Evento (local) | Equipo ↔ Evento | un equipo participa como local en varios eventos | 1:N | CONFIRMADO |
| R-13 | Equipo–Evento (visitante) | Equipo ↔ Evento | un equipo participa como visitante en varios eventos | 1:N | CONFIRMADO |
| R-14 | Estadio–Evento | Estadio ↔ Evento | un estadio es sede de varios eventos | 1:N | PROPUESTA |
| R-15 | Evento–CalendarioArbitro | Evento ↔ CalendarioArbitro | un evento programa varias designaciones | 1:N | PROPUESTA |
| R-16 | Arbitro–CalendarioArbitro | Arbitro ↔ CalendarioArbitro | un árbitro dirige varios eventos | 1:N | PROPUESTA |
| R-17 | Evento–Mercado | Evento ↔ Mercado | un evento ofrece varios mercados | 1:N | CONFIRMADO |
| R-18 | Mercado–OpcionApuesta | Mercado ↔ OpcionApuesta | un mercado contiene varias opciones | 1:N | CONFIRMADO |
| R-19 | OpcionApuesta–HistorialCuota | OpcionApuesta ↔ HistorialCuota | una opción registra varios cambios de cuota | 1:N | PROPUESTA |
| R-20 | Usuario–Apuesta | Usuario ↔ Apuesta | un usuario realiza varias apuestas | 1:N | CONFIRMADO |
| R-21 | OpcionApuesta–Apuesta | OpcionApuesta ↔ Apuesta | una opción es seleccionada en varias apuestas | 1:N | CONFIRMADO |
| R-22 | Usuario–FavoritoEquipo | Usuario ↔ FavoritoEquipo | un usuario marca varios favoritos | 1:N | PROPUESTA |
| R-23 | Equipo–FavoritoEquipo | Equipo ↔ FavoritoEquipo | un equipo es favorito de varios usuarios | 1:N | PROPUESTA |
| R-24 | Usuario–SaldoCuenta | Usuario ↔ SaldoCuenta | un usuario posee varias cuentas de saldo | 1:N | CONFIRMADO |
| R-25 | TipoSaldo–SaldoCuenta | TipoSaldo ↔ SaldoCuenta | un tipo de saldo tipifica varias cuentas | 1:N | CONFIRMADO |
| R-26 | SaldoCuenta–MovimientoSaldo | SaldoCuenta ↔ MovimientoSaldo | una cuenta registra varios movimientos | 1:N | CONFIRMADO |
| R-27 | TipoMovimiento–MovimientoSaldo | TipoMovimientoSaldo ↔ MovimientoSaldo | un tipo clasifica varios movimientos | 1:N | PROPUESTA |
| R-28 | Usuario–Recarga | Usuario ↔ Recarga | un usuario recibe varias recargas | 1:N | CONFIRMADO |
| R-29 | TipoSaldo–Recarga | TipoSaldo ↔ Recarga | un tipo de saldo tipifica varias recargas | 1:N | CONFIRMADO |
| R-30 | Evento–Resultado | Evento ↔ Resultado | un evento produce un resultado oficial | 1:1 | CONFIRMADO |
| R-31 | Resultado–Liquidacion | Resultado ↔ Liquidacion | un resultado determina varias liquidaciones | 1:N | CONFIRMADO |
| R-32 | Apuesta–Liquidacion | Apuesta ↔ Liquidacion | una apuesta se resuelve en una liquidación | 1:1 | CONFIRMADO |
| R-33 | Usuario–Notificacion | Usuario ↔ Notificacion | un usuario recibe varias notificaciones | 1:N | PROPUESTA |
| R-34 | Usuario–Auditoria | Usuario ↔ Auditoria | un usuario genera varios registros de auditoría | 1:N | PROPUESTA |

---

## Relaciones muchos a muchos (N:M) y su resolución

| Relación N:M | Entidad asociativa | Atributos propios de la asociación |
|---|---|---|
| Usuario ↔ PreguntaSeguridad | **RespuestaSeguridad** | respuesta, fecha de registro |
| Evento ↔ Arbitro | **CalendarioArbitro** | rol del árbitro en el evento, fecha de designación |
| Usuario ↔ Equipo | **FavoritoEquipo** | fecha en que se marcó como favorito |
| Usuario ↔ TipoSaldo | **SaldoCuenta** | saldo actual, fecha de última actualización |
| Apuesta ↔ Resultado | **Liquidacion** | resultado de la liquidación, monto del premio, fecha |

---

## Relaciones con rol o doble vínculo

- **Evento ↔ Equipo:** existen **dos** relaciones independientes entre las mismas entidades (equipo **local** y equipo **visitante**). Deben distinguirse por su rol.
- **Evento ↔ Resultado:** relación **1:1**; solo se materializa cuando el evento finaliza y se registra el resultado oficial.
- **Apuesta ↔ Liquidacion:** relación **1:1 parcial**; una apuesta solo tiene liquidación cuando el evento se ha resuelto, y **nunca más de una** (RN-14).
