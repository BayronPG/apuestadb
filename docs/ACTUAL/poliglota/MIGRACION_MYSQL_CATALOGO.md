# Migración del catálogo deportivo a MySQL — Fase 15

**Fecha:** 08/nov/2026 · **Rama:** `poliglota` · **Estado:** catalogo migrado y validado.

## 1. Alcance

- 15 tablas del catálogo deportivo migradas desde SQL Server (`ApuestaDB`) a MySQL (`apuestadb`).
- 1 tabla nueva: **Jugador** (16 tablas MySQL en total).
- SQL Server conserva el sistema funcional y sigue siendo el origen de los datos.
- PostgreSQL y MongoDB **no** se modifican en esta fase.
- **Estadio = cancha** (decisión confirmada por Jhon, 08/nov/2026). No existe tabla `Cancha`.

## 2. Inventario origen (SQL Server)

| Tabla | Filas | PK | Depende de |
|---|---:|---|---|
| Pais | 6 | id_pais | — |
| Ciudad | 12 | id_ciudad | Pais |
| Estadio | 12 | id_estadio | Ciudad |
| Deporte | 6 | id_deporte | — |
| Liga | 6 | id_liga | Deporte |
| Temporada | 7 | id_temporada | Liga |
| Equipo | 13 | id_equipo | Deporte, Ciudad |
| Arbitro | 6 | id_arbitro | — |
| Evento | 9 | id_evento | Temporada, Equipo (local/visitante), Estadio |
| CalendarioArbitro | 10 | id_calendario | Evento, Arbitro |
| Mercado | 9 | id_mercado | Evento |
| OpcionApuesta | 27 | id_opcion | Mercado |
| HistorialCuota | 30 | id_historial | OpcionApuesta |
| Resultado | 7 | id_resultado | Evento |
| FavoritoEquipo | 7 | id_favorito | Equipo (Usuario es referencia lógica) |

**Total migrado: 167 filas.**

### Referencias entre motores

- `FavoritoEquipo.id_usuario` → `Usuario` en SQL Server. Sin FK en MySQL (integridad de aplicación).
- `Apuesta`, `Liquidacion`, `Notificacion` y `Auditoria` permanecen en MongoDB (sin cambios).

### Objetos SQL Server asociados al catálogo

- Vistas: `vw_EventosActivos`, `vw_EventosFinalizados` → replicadas en MySQL.
- La función `fn_OpcionGanadora` se traduce como expresión `CASE` dentro de `vw_EventosFinalizados`.
- Procedimientos, triggers y funciones de otros dominios **no** se migran en esta fase.

## 3. Esquema MySQL

| Elemento | Cantidad |
|---|---:|
| Tablas | 16 |
| Vistas | 2 |
| Foreign keys | 18 |
| UNIQUE | 16 |
| CHECK | 20 |
| Índices explícitos | 10 |

Traducciones aplicadas: `IDENTITY` → `AUTO_INCREMENT`; `NVARCHAR` → `VARCHAR` utf8mb4;
`BIT` → `TINYINT(1)`; `DATETIME2(3)` → `DATETIME(3)`; `DECIMAL` conserva precisión y escala;
`SMALLINT` se mantiene; InnoDB + `utf8mb4_0900_ai_ci`.

Restricciones destacadas: `CK_Evento_equipos` (local ≠ visitante, RN-16), `CK_Mercado_fechas`,
`CK_Temporada_fechas`, `UQ_Evento`, `UQ_OpcionApuesta`, `UQ_Resultado`.

## 4. Tabla nueva Jugador

- `id_jugador` BIGINT AUTO_INCREMENT, `id_equipo` con FK a `Equipo`.
- UNIQUE (`id_equipo`, `numero_camiseta`) con NULL permitido.
- CHECK camiseta 1–99 y estado `activo`/`inactivo`.
- Índices por equipo y por (`apellidos`, `nombres`).
- Semilla: **26 jugadores ficticios** (2 por cada uno de los 13 equipos). Idempotente.
- No interviene en apuestas, mercados, resultados ni saldos; no se relaciona con `Usuario`.

## 5. Migración

`database/mysql/04_migrate.js`:

- lee SQL Server en modo solo lectura y escribe en MySQL;
- conserva identificadores, orden de dependencias y lotes de 500 filas;
- convierte fechas a UTC con milisegundos (sin pérdida);
- es idempotente (`INSERT ... ON DUPLICATE KEY UPDATE` por PK);
- se detiene si el conteo origen/destino difiere.

## 6. Resultados verificados

| Control | Resultado |
|---|---|
| DDL ejecutado dos veces | OK |
| Migración ejecutada dos veces | OK (167 filas, sin duplicados) |
| IDs conservados (15 tablas: conteo, mínimo, máximo y suma) | OK |
| Cuotas (`OpcionApuesta`, `HistorialCuota`) | OK sin pérdida |
| Fechas de evento | OK (misma marca con milisegundos) |
| Huérfanos internos (18 relaciones) | 0 |
| RN-16 (local ≠ visitante) | 0 violaciones |
| Jugador: seed idempotente | OK (26, segunda ejecución sin cambios) |
| Jugador: camiseta inválida / duplicada | 0 / rechazada con 409 |
| Vistas `vw_Eventos*` | 2 y con filas |

## 7. Backend

- `CATALOGO_MOTOR=sqlserver` (predeterminado): comportamiento actual.
- `CATALOGO_MOTOR=mysql`: eventos y catálogo se leen de MySQL; contratos HTTP sin cambios.
- Endpoints nuevos: `GET /api/jugadores`, `GET /api/equipos/:id/jugadores`, `POST /api/jugadores` (administrador).
- Las escrituras de resultados siguen en SQL Server (fuente funcional) hasta la fase de migración de escrituras.
