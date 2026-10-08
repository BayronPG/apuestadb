# COBERTURA.md — Entregable de consultas SQL (Fase 13)

**Proyecto:** ApuestaDB — Bases de Datos 2 (Tecnológico de Antioquia)
**Motor:** SQL Server (T-SQL) · base `ApuestaDB` en `localhost\SQLEXPRESS01`
**Fecha:** 21/sep/2026

## 1. Cumplimiento del requisito del profesor

| Requerido | Entregado | Archivo | Estado |
|---|---|---|---|
| 80 SELECT | 80 (S-001 … S-080) | `01_select.sql` | ✅ |
| 20 INSERT | 20 (I-001 … I-020) | `02_insert.sql` | ✅ |
| 20 UPDATE | 20 (U-001 … U-020) | `03_update.sql` | ✅ |
| 20 DELETE | 20 (D-001 … D-020) | `04_delete.sql` | ✅ |
| 20 JOIN (aparte) | 20 (J-001 … J-020) | `05_join.sql` | ✅ |
| 5 procedimientos | 14 existentes (Fase 7) | `database/procedures/` | ✅ ya cumplía |
| 5 vistas | 12 existentes (Fase 8) | `database/views/` | ✅ ya cumplía |
| 10 funciones | 6 existentes + 4 nuevas | `06_funciones_adicionales.sql` | ✅ 10 |

Las 160 sentencias son **distintas** entre sí (tabla, filtro, forma de consulta o función diferente en cada una).

## 2. Cobertura de las 80 SELECT

### 2.1 Las 29 tablas del modelo (2 sentencias por tabla)

| Tabla | Sentencias | Tabla | Sentencias |
|---|---|---|---|
| Rol | S-001, S-002 | CalendarioArbitro | S-029, S-030 |
| Usuario | S-003, S-004 | Mercado | S-031, S-032 |
| PreguntaSeguridad | S-005, S-006 | OpcionApuesta | S-033, S-034 |
| RespuestaSeguridad | S-007, S-008 | HistorialCuota | S-035, S-036 |
| TokenRecuperacion | S-009, S-010 | Apuesta | S-037, S-038 |
| Pais | S-011, S-012 | FavoritoEquipo | S-039, S-040 |
| Ciudad | S-013, S-014 | TipoSaldo | S-041, S-042 |
| Estadio | S-015, S-016 | SaldoCuenta | S-043, S-044 |
| Deporte | S-017, S-018 | TipoMovimientoSaldo | S-045, S-046 |
| Liga | S-019, S-020 | MovimientoSaldo | S-047, S-048 |
| Temporada | S-021, S-022 | Recarga | S-049, S-050 |
| Equipo | S-023, S-024 | Resultado | S-051, S-052 |
| Arbitro | S-025, S-026 | Liquidacion | S-053, S-054 |
| Evento | S-027, S-028 | Notificacion | S-055, S-056 |
| | | Auditoria | S-057, S-058 |

### 2.2 Las 12 vistas del modelo (1 sentencia por vista)

| Vista | Sentencia | Vista | Sentencia |
|---|---|---|---|
| vw_EventosActivos | S-059 | vw_SaldoConsolidado | S-065 |
| vw_EventosFinalizados | S-060 | vw_HistorialMovimientos | S-066 |
| vw_HistorialApuestas | S-061 | vw_RankingUsuarios | S-067 |
| vw_ApuestasPendientes | S-062 | vw_ReporteAdministrativo | S-068 |
| vw_ApuestasGanadas | S-063 | vw_ReporteFinanciero | S-069 |
| vw_ApuestasPerdidas | S-064 | vw_ReporteAuditoria | S-070 |

### 2.3 Consultas avanzadas (10)

| Sentencia | Recurso demostrado |
|---|---|
| S-071 | UNION |
| S-072 | UNION ALL con etiqueta de origen |
| S-073 | INTERSECT |
| S-074 | EXCEPT |
| S-075 | AVG() OVER () |
| S-076 | SUM() OVER (PARTITION BY … ) |
| S-077 | PIVOT |
| S-078 | STUFF + FOR XML PATH |
| S-079 | CTE (WITH) |
| S-080 | DENSE_RANK() OVER + TOP |

## 3. Detalle de INSERT, UPDATE, DELETE y JOIN

| # | INSERT (tabla) | UPDATE (tabla) | DELETE (tabla) | JOIN (tipo) |
|---|---|---|---|---|
| 1 | Pais | Pais | Notificacion | INNER JOIN |
| 2 | Ciudad | Ciudad | Auditoria | INNER multi-tabla (4) |
| 3 | Estadio | Estadio | FavoritoEquipo | LEFT JOIN |
| 4 | Deporte | Deporte | TokenRecuperacion | LEFT + IS NULL |
| 5 | Liga | Liga | RespuestaSeguridad | RIGHT JOIN |
| 6 | Temporada | Temporada | Recarga | FULL OUTER JOIN |
| 7 | Equipo (local) | Equipo | Resultado | CROSS JOIN |
| 8 | Equipo (visitante) | Arbitro | CalendarioArbitro | SELF JOIN |
| 9 | Arbitro | Usuario | Mercado | JOIN de 4 tablas |
| 10 | Usuario | PreguntaSeguridad | Evento | JOIN de 5 tablas |
| 11 | RespuestaSeguridad | RespuestaSeguridad | Temporada | JOIN 6 tablas + GROUP BY |
| 12 | TokenRecuperacion | TokenRecuperacion | Equipo (TOP 1) | JOIN + HAVING |
| 13 | Evento | Evento | Equipo (IN) | JOIN + RANK() OVER |
| 14 | CalendarioArbitro | CalendarioArbitro | Arbitro | JOIN + CTE |
| 15 | Mercado | Mercado | Estadio | JOIN + CASE |
| 16 | OpcionApuesta | OpcionApuesta | Ciudad | JOIN + subconsulta correlacionada |
| 17 | SaldoCuenta | Apuesta | Pais | JOIN vista + tabla |
| 18 | Recarga | SaldoCuenta | Liga | OUTER APPLY |
| 19 | Apuesta | Recarga | Deporte | Cadena de 8 tablas |
| 20 | MovimientoSaldo | Resultado | Usuario | CROSS APPLY con función |

## 4. Decisiones de diseño que conviene defender en la sustentación

1. **JOIN separados:** `01_select.sql` no contiene ningún JOIN; las combinaciones entre tablas usan subconsultas. Así los 20 JOIN de `05_join.sql` se cuentan aparte, como pidió el profesor.
2. **Los DML son re-ejecutables:** `02`, `03` y `04` corren dentro de una transacción que termina en `ROLLBACK`. La base de demostración nunca queda alterada. Para aplicar los cambios de forma permanente basta cambiar esa línea por `COMMIT`.
3. **`04_delete.sql` crea su propio escenario:** los borrados se hacen sobre filas etiquetadas `BORRADOR` que el propio script crea (bloque de *ambientación*, que no cuenta como sentencia DELETE). El orden de borrado respeta las llaves foráneas: de hijo a padre.
4. **Respeto a las reglas del modelo (triggers):** no se borran `MovimientoSaldo`, `HistorialCuota`, `Liquidacion` ni `SaldoCuenta`, porque el modelo los declara inmutables o críticos (`trg_*_NoEliminar`, `trg_SaldoCuenta_Proteger`). El script lo documenta en su encabezado.
5. **Funciones:** las 4 nuevas son escalares y se apoyan en el dominio existente (margen, acierto, cuota promedio y validación de saldo). `fn_SaldoSuficiente` reutiliza `fn_SaldoDisponible`.
6. **Complementan, no reemplazan:** los 14 procedimientos, 12 vistas y 13 triggers de las fases 7–9 siguen siendo la capa de negocio; este entregable es la colección de sentencias exigida.

## 6. Verificación real ejecutada (21/sep/2026)

Todo el entregable se ejecutó contra la base `ApuestaDB` real (`localhost\SQLEXPRESS01`):

| Prueba | Resultado |
|---|---|
| Ejecución de los 6 archivos | **6/6 sin errores** (exit code 0 con `-b`) |
| Sentencias por archivo | 80 SELECT · 20 INSERT · 20 UPDATE · 20 DELETE · 20 JOIN |
| Filas totales antes / después de correr todo | **382 / 382** → los scripts no alteran la base |
| Registros residuales de las pruebas DML (hoy) | Auditoría 0 · Historial de cuota 0 · Movimientos 0 |
| Funciones del modelo | **10** (`fn_diagramobjects` no se cuenta: la crea SSMS al abrir Diagramas) |

Hallazgo menor: la documentación de la Fase 12.1 registra 344 registros y la base hoy tiene 382 (diferencia de 38 filas, probablemente generada por los triggers de auditoría e historial en ejecuciones posteriores al cierre de esa fase). Conviene reconciliar el conteo antes de la sustentación.

## 7. Cómo ejecutar todo el entregable

```bat
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\01_select.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\02_insert.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\03_update.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\04_delete.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\05_join.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\06_funciones_adicionales.sql
```

Orden recomendado: primero `06` (crea las funciones nuevas), luego `01`, `02`, `03`, `04` y `05`.
