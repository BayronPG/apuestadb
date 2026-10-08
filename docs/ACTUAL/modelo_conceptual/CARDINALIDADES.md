# Cardinalidades — ApuestaDB (Modelo Conceptual · Fase 2)

**Fuente exclusiva:** Fase 1. **Nivel:** conceptual.
> Este documento responde a la tarea 4: determinar cardinalidades.
> Notación: **(mínimo, máximo)** por lado de la relación. **Participación total** = (1,1) obligatorio; **parcial** = (0,N) opcional.

---

## Detalle por relación

| ID | Relación | Lado A (card.) | Lado B (card.) | Participación |
|---|---|---|---|---|
| R-01 | Rol–Usuario | Rol (0,N) | Usuario (1,1) | Usuario **total**; Rol parcial |
| R-02 | Usuario–RespuestaSeguridad | Usuario (0,N) | RespuestaSeguridad (1,1) | RespuestaSeguridad **total** |
| R-03 | Pregunta–RespuestaSeguridad | PreguntaSeguridad (0,N) | RespuestaSeguridad (1,1) | RespuestaSeguridad **total** |
| R-04 | Usuario–TokenRecuperacion | Usuario (0,N) | TokenRecuperacion (1,1) | TokenRecuperacion **total** |
| R-05 | Pais–Ciudad | Pais (1,N) | Ciudad (1,1) | Ciudad **total** |
| R-06 | Ciudad–Estadio | Ciudad (0,N) | Estadio (1,1) | Estadio **total** |
| R-07 | Ciudad–Equipo | Ciudad (0,N) | Equipo (1,1) | Equipo **total** |
| R-08 | Deporte–Liga | Deporte (1,N) | Liga (1,1) | Liga **total** |
| R-09 | Deporte–Equipo | Deporte (1,N) | Equipo (1,1) | Equipo **total** |
| R-10 | Liga–Temporada | Liga (1,N) | Temporada (1,1) | Temporada **total** |
| R-11 | Temporada–Evento | Temporada (1,N) | Evento (1,1) | Evento **total** |
| R-12 | Equipo–Evento (local) | Equipo (0,N) | Evento (1,1) | Evento **total** (siempre hay local) |
| R-13 | Equipo–Evento (visitante) | Equipo (0,N) | Evento (1,1) | Evento **total** (siempre hay visitante) |
| R-14 | Estadio–Evento | Estadio (0,N) | Evento (1,1) | Evento **total** |
| R-15 | Evento–CalendarioArbitro | Evento (1,N) | CalendarioArbitro (1,1) | CalendarioArbitro **total** |
| R-16 | Arbitro–CalendarioArbitro | Arbitro (0,N) | CalendarioArbitro (1,1) | CalendarioArbitro **total** |
| R-17 | Evento–Mercado | Evento (1,N) | Mercado (1,1) | Mercado **total** |
| R-18 | Mercado–OpcionApuesta | Mercado (1,N) | OpcionApuesta (1,1) | OpcionApuesta **total** |
| R-19 | OpcionApuesta–HistorialCuota | OpcionApuesta (1,N) | HistorialCuota (1,1) | HistorialCuota **total** |
| R-20 | Usuario–Apuesta | Usuario (0,N) | Apuesta (1,1) | Apuesta **total** |
| R-21 | OpcionApuesta–Apuesta | OpcionApuesta (0,N) | Apuesta (1,1) | Apuesta **total** |
| R-22 | Usuario–FavoritoEquipo | Usuario (0,N) | FavoritoEquipo (1,1) | FavoritoEquipo **total** |
| R-23 | Equipo–FavoritoEquipo | Equipo (0,N) | FavoritoEquipo (1,1) | FavoritoEquipo **total** |
| R-24 | Usuario–SaldoCuenta | Usuario (1,N) | SaldoCuenta (1,1) | Usuario **total** (tiene sus cuentas de saldo) |
| R-25 | TipoSaldo–SaldoCuenta | TipoSaldo (1,N) | SaldoCuenta (1,1) | SaldoCuenta **total** |
| R-26 | SaldoCuenta–MovimientoSaldo | SaldoCuenta (0,N) | MovimientoSaldo (1,1) | MovimientoSaldo **total** |
| R-27 | TipoMovimiento–MovimientoSaldo | TipoMovimientoSaldo (1,N) | MovimientoSaldo (1,1) | MovimientoSaldo **total** |
| R-28 | Usuario–Recarga | Usuario (0,N) | Recarga (1,1) | Recarga **total** |
| R-29 | TipoSaldo–Recarga | TipoSaldo (1,N) | Recarga (1,1) | Recarga **total** |
| R-30 | Evento–Resultado | Evento (1,1) | Resultado (1,1) | **Parcial**: el resultado existe solo tras finalizar |
| R-31 | Resultado–Liquidacion | Resultado (1,N) | Liquidacion (1,1) | Liquidacion **total** |
| R-32 | Apuesta–Liquidacion | Apuesta (0,1) | Liquidacion (1,1) | **Parcial**: la apuesta se liquida a lo sumo una vez |
| R-33 | Usuario–Notificacion | Usuario (0,N) | Notificacion (1,1) | Notificacion **total** |
| R-34 | Usuario–Auditoria | Usuario (0,N) | Auditoria (0,1) | **Parcial**: hay auditoría sin usuario (procesos del sistema) |

---

## Lecturas de cardinalidad clave

- **Un usuario ↔ un rol:** cada usuario tiene **exactamente un** rol; un rol agrupa **muchos** usuarios.
- **Un evento ↔ dos equipos:** cada evento enfrenta **exactamente dos** equipos, uno en rol local y otro en rol visitante; un equipo puede aparecer en muchos eventos (R-12, R-13).
- **Un evento ↔ un resultado:** como máximo **un** resultado oficial por evento (R-30).
- **Una apuesta ↔ una liquidación:** **a lo sumo una** liquidación por apuesta; una liquidación pertenece a una sola apuesta (R-32, coherente con RN-14).
- **Un usuario ↔ un saldo por tipo:** el usuario mantiene **una cuenta de saldo por cada tipo** (tokens y PSE), sin conversión (R-24, R-25; RN-02..RN-06).
- **Una apuesta ↔ un tipo de saldo:** la apuesta se paga con **un solo** tipo de saldo y el premio vuelve al mismo tipo (RN-03, RN-04).
