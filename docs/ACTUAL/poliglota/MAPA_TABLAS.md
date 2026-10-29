# Mapa de tablas por motor (Fase 14)

Distribución propuesta de las 29 tablas de ApuestaDB entre cuatro motores. Sin cambios en la base actual: es un mapa de trabajo para la Fase 14.

## 1. SQL Server (5) — seguridad y usuarios

| Tabla | Rol |
|---|---|
| Rol | Catálogo de roles |
| Usuario | Cuentas y credenciales |
| PreguntaSeguridad | Catálogo de preguntas |
| RespuestaSeguridad | Respuestas por usuario |
| TokenRecuperacion | Tokens de recuperación |

## 2. MySQL (15) — catálogo deportivo y operación

| Tabla | Rol |
|---|---|
| Pais | Catálogo geográfico |
| Ciudad | Catálogo geográfico |
| Estadio | Sede del evento (equivalente a cancha) |
| Deporte | Catálogo deportivo |
| Liga | Competición |
| Temporada | Periodo de la liga |
| Equipo | Participantes |
| Arbitro | Árbitros |
| Evento | Partido programado |
| CalendarioArbitro | Designación de árbitros |
| Mercado | Mercados del evento |
| OpcionApuesta | Opciones y cuota vigente |
| HistorialCuota | Cambios de cuota |
| Resultado | Marcador oficial |
| FavoritoEquipo | Equipos favoritos del usuario |

## 3. PostgreSQL (5) — saldo ficticio

| Tabla | Rol |
|---|---|
| TipoSaldo | Tokens / PSE |
| SaldoCuenta | Saldo por usuario y tipo |
| TipoMovimientoSaldo | Naturaleza del movimiento |
| MovimientoSaldo | Libro de movimientos |
| Recarga | Recargas ficticias |

## 4. MongoDB (4) — apuestas y trazas

| Tabla | Rol |
|---|---|
| Apuesta | Documento de apuesta con cuota copiada |
| Liquidacion | Resultado y premio por apuesta |
| Notificacion | Avisos al usuario |
| Auditoria | Traza de operaciones |

## 5. Referencias entre motores (sin FK real)

| Referencia | Motores |
|---|---|
| Apuesta → Usuario, OpcionApuesta, TipoSaldo | MongoDB → SQL Server / MySQL / PostgreSQL |
| SaldoCuenta y Recarga → Usuario | PostgreSQL → SQL Server |
| MovimientoSaldo → Apuesta | PostgreSQL → MongoDB |
| FavoritoEquipo, Notificacion y Auditoria → Usuario | MySQL / MongoDB → SQL Server |

Las 38 FK del modelo físico dejan de existir como restricción entre motores; la integridad pasa a validación de aplicación.

## 6. Reglas de consistencia

- Generar el id de apuesta antes de escribir en MongoDB y en los movimientos de saldo.
- Idempotencia en `MovimientoSaldo` (referencia única por apuesta o recarga).
- Compensación explícita si falla la escritura en MongoDB tras descontar saldo.
- Copiar la cuota dentro del documento de apuesta (cuota congelada, sin releer MySQL).
- Los triggers que hoy cruzan motores pasan al backend como servicios de dominio.

## 7. Pendientes del profesor

- Firebase y Wompi: alcance, permisos y entorno.
- `Estadio` como cancha en el nuevo modelo.
- Incorporar la tabla `Jugador`.
- Qué conserva SQL Server tras la distribución.
- Actualizar la declaración "sin pasarelas de pago" cuando se integre Wompi.
