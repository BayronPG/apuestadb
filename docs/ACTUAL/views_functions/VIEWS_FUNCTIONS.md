# Views y Functions — ApuestaDB (Fase 8)

**Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia) · **Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García
**Motor:** SQL Server · **Ubicación:** `database/views/` y `database/functions/`
**Restricciones de la fase:** no se generan triggers y no se modifican tablas ni procedimientos.

---

## 1. Orden de ejecución

> **Importante:** las **funciones** deben crearse **antes** de las vistas que las usan (`vw_EventosFinalizados` usa `fn_OpcionGanadora`; `vw_HistorialApuestas` usa `fn_PremioPotencial`). A diferencia de los procedimientos, las **vistas validan sus dependencias al crearse**.

1. `functions/01_escalares.sql`
2. `functions/02_table_valued.sql`
3. `views/01_eventos.sql`
4. `views/02_apuestas.sql`
5. `views/03_saldo.sql`
6. `views/04_reportes.sql`

---

## 2. Views (12)

| # | Vista | Objetivo | Archivo |
|---|---|---|---|
| 1 | `vw_EventosActivos` | Eventos programados o en curso, con datos de liga, equipos, sede y mercados abiertos | 01_eventos |
| 2 | `vw_EventosFinalizados` | Eventos finalizados con marcador y opción ganadora derivada | 01_eventos |
| 3 | `vw_HistorialApuestas` | Historial completo de apuestas (base de las vistas por estado) | 02_apuestas |
| 4 | `vw_ApuestasPendientes` | Apuestas sin liquidar | 02_apuestas |
| 5 | `vw_ApuestasGanadas` | Apuestas liquidadas como ganadas, con premio | 02_apuestas |
| 6 | `vw_ApuestasPerdidas` | Apuestas liquidadas como perdidas | 02_apuestas |
| 7 | `vw_SaldoConsolidado` | Saldo por usuario (tokens, PSE y total) | 03_saldo |
| 8 | `vw_HistorialMovimientos` | Movimientos de saldo con concepto, naturaleza y saldo resultante | 03_saldo |
| 9 | `vw_RankingUsuarios` | Clasificación por ganancia neta y premios (incluye `posicion`) | 04_reportes |
| 10 | `vw_ReporteAdministrativo` | Resumen por evento: apuestas, monto, premios y margen | 04_reportes |
| 11 | `vw_ReporteFinanciero` | Resumen por tipo de saldo: recargado, apostado, premios y saldo en cuentas | 04_reportes |
| 12 | `vw_ReporteAuditoria` | Auditoría con usuario, rol, operación y resultado | 04_reportes |

### Descripción ampliada

- **vw_EventosActivos** — *parámetros:* ninguno · *resultado:* una fila por evento vigente · *casos de uso:* cartelera del usuario y selección de partidos.
- **vw_EventosFinalizados** — *parámetros:* ninguno · *resultado:* evento + marcador + `opcion_ganadora` · *casos de uso:* consulta de resultados y verificación previa a liquidar.
- **vw_HistorialApuestas** — *parámetros:* ninguno · *resultado:* apuestas con usuario, evento, opción, cuota, monto, premio potencial y liquidación · *casos de uso:* consulta del usuario y base de reportes.
- **vw_ApuestasPendientes / Ganadas / Perdidas** — *resultado:* subconjunto de `vw_HistorialApuestas` filtrado por estado · *casos de uso:* seguimiento, premios y análisis.
- **vw_SaldoConsolidado** — *resultado:* saldo por tipo y total por usuario · *casos de uso:* panel del usuario y control administrativo.
- **vw_HistorialMovimientos** — *resultado:* movimientos con concepto y saldo resultante · *casos de uso:* extracto y auditoría financiera.
- **vw_RankingUsuarios** — *resultado:* métricas por usuario + `posicion` (RANK) · *casos de uso:* panel de posiciones.
- **vw_ReporteAdministrativo** — *resultado:* métricas por evento (incluye margen = apostado − premios) · *casos de uso:* seguimiento de la operación.
- **vw_ReporteFinanciero** — *resultado:* métricas por tipo de saldo (usa subconsultas para evitar productos cartesianos) · *casos de uso:* reporte financiero del saldo ficticio.
- **vw_ReporteAuditoria** — *resultado:* registros de auditoría con usuario y rol · *casos de uso:* revisión de accesos y operaciones sensibles.

---

## 3. Functions (6)

| # | Función | Tipo | Objetivo | Retorna |
|---|---|---|---|---|
| 1 | `fn_PremioPotencial` | **Escalar** | Premio potencial = monto × cuota | DECIMAL(18,2) |
| 2 | `fn_OpcionGanadora` | **Escalar** | Opción ganadora según el marcador | VARCHAR(20) |
| 3 | `fn_SaldoDisponible` | **Escalar** | Saldo disponible de un usuario por tipo | DECIMAL(18,2) |
| 4 | `fn_GananciaAcumulada` | **Escalar** | Ganancia neta del usuario (premios − apostado) | DECIMAL(18,2) |
| 5 | `fn_EstadisticasUsuario` | **Table-valued (inline)** | Totales de actividad del usuario | tabla (1 fila) |
| 6 | `fn_EstadisticasEvento` | **Table-valued (inline)** | Totales y distribución por opción de un evento | tabla (1 fila) |

### Descripción ampliada

- **fn_PremioPotencial(@monto, @cuota)** — *validaciones:* devuelve 0 si monto/cuota no son válidos · *casos de uso:* columna `premio_potencial` en `vw_HistorialApuestas` y simulaciones del usuario.
- **fn_OpcionGanadora(@marcador_local, @marcador_visitante)** — *resultado:* `local`/`empate`/`visitante` o NULL · *casos de uso:* `vw_EventosFinalizados` y lógica de liquidación (RN-15, decisión C-2).
- **fn_SaldoDisponible(@id_usuario, @id_tipo_saldo)** — *resultado:* saldo actual o 0 · *casos de uso:* validaciones previas a apostar (RN-08).
- **fn_GananciaAcumulada(@id_usuario)** — *resultado:* premios totales − monto de apuestas resueltas · *casos de uso:* ranking y perfil.
- **fn_EstadisticasUsuario(@id_usuario)** — *resultado:* total de apuestas, ganadas, perdidas, pendientes, apostado, premios y ganancia neta · *casos de uso:* perfil del usuario.
- **fn_EstadisticasEvento(@id_evento)** — *resultado:* apuestas, monto, premios y distribución local/empate/visitante · *casos de uso:* reporte administrativo por evento.

---

## 4. Relación con fases anteriores

- **Tablas:** no se modificó ninguna (se respetó la restricción de la fase).
- **Procedimientos:** no se modificó ninguno. Las vistas y funciones son **de solo lectura** y complementan la Fase 7.
- **Dictamen de la Fase 4.1:** `fn_OpcionGanadora` materializa la corrección **C-2** (la opción ganadora se deriva del marcador y no se almacena).

## 5. Pendiente de las siguientes fases

- **Triggers** (auditoría automática, validaciones de integridad no declarativa).
- Datos de prueba ampliados, consultas avanzadas y reportes finales.
