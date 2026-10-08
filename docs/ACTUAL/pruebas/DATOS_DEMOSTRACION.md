# DATOS DE DEMOSTRACION — ApuestaDB (Fase 12.1)

Base: `ApuestaDB` en `localhost\SQLEXPRESS01` · Script: `database/06_demo_data.sql`
Datos **ficticios**: sin dinero real ni pasarelas de pago. Fecha de carga: 14/sep/2026.

## 1. Resumen

| Concepto | Valor |
|---|---|
| Tablas pobladas | **29 de 29** (objetos de usuario) |
| Registros cargados por `06_demo_data.sql` | **278** |
| Registros totales en la base | **335** (ver §7: base recuperada el 07/oct/2026) |
| Tablas por debajo de 5 filas | 4 (catalogos de dominio cerrado, ver §3) |
| Errores de FK/CHECK durante la carga | **0** |
| Vistas con informacion | **12 de 12** |

## 2. Registros por tabla

| Tabla | Filas | Tabla | Filas |
|---|---|---|---|
| Rol | 2 | MovimientoSaldo | 27 |
| Usuario | 8 | Recarga | 9 |
| PreguntaSeguridad | 6 | Resultado | 7 |
| RespuestaSeguridad | 6 | Liquidacion | 9 |
| TokenRecuperacion | 9 | Notificacion | 14 |
| Pais | 6 | Auditoria | 45 |
| Ciudad | 12 | Deporte | 6 |
| Estadio | 12 | Liga | 6 |
| Equipo | 13 | Temporada | 7 |
| Arbitro | 6 | Evento | 9 |
| CalendarioArbitro | 10 | Mercado | 9 |
| OpcionApuesta | 27 | HistorialCuota | 30 |
| Apuesta | 11 | TipoSaldo | 2 |
| SaldoCuenta | 16 | TipoMovimientoSaldo | 4 |
| FavoritoEquipo | 7 | **Total** | **335** |

## 3. Tablas que no pueden tener 5 filas (justificacion)

Son catalogos de **dominio cerrado** validados con `CHECK`; el modelo no admite mas valores:

| Tabla | Filas | Restriccion |
|---|---|---|
| Rol | 2 | `CK_Rol_nombre`: 'usuario' \| 'administrador' |
| TipoSaldo | 2 | `CK_TipoSaldo_nombre`: 'tokens' \| 'PSE' |
| TipoMovimientoSaldo | 4 | `CK_TipoMovimientoSaldo_nombre`: apuesta, premio, recarga, ajuste |
| OpcionApuesta | 3 por mercado | `CK_OpcionApuesta_etiqueta`: local \| empate \| visitante |

`OpcionApuesta` tiene 27 filas en total (9 mercados x 3 opciones), por encima del minimo.

## 4. Escenarios de demostracion disponibles

1. **Catalogo deportivo** — 6 deportes, 6 ligas, 7 temporadas, 13 equipos reales (Nacional, Millonarios, America, Junior, DIM, Real Madrid, Barcelona, Man United, Liverpool, Milan, Inter, Lakers, Heat), 12 estadios, 6 arbitros y 10 designaciones (principal/asistente).
2. **Mercados y cuotas** — 9 mercados "Resultado final" (6 cerrados y 2 abiertos + 1 de Fase 12), 27 opciones y 30 registros de `HistorialCuota` (alta automatica por trigger + 3 ajustes previos).
3. **Apuestas y liquidacion** — 11 apuestas simples: 7 ganadas, 2 perdidas y 2 pendientes; premios calculados como `monto x cuota_congelada` (92500, 62000, 84000, 117000, 57500, 31000).
4. **Saldo ficticio** — 16 cuentas (tokens/PSE) y 27 movimientos con `saldo_resultante` encadenado (recarga → debito por apuesta → credito por premio). Saldos finales: 286500, 70000, 162000, 70000, 339500, 101000 tokens (y 50000 / 60000 PSE).
5. **Seguridad y usuarios** — 8 usuarios (2 de Fase 12 + 6 nuevos), 8 PSE/tokens, 6 preguntas de seguridad, 6 respuestas y 9 tokens de recuperacion (vigente, usado y expirado).
6. **Preferencias, notificaciones y auditoria** — 7 equipos favoritos, 14 notificaciones (leida/no leida) y 54 registros de auditoria (triggers + operaciones administrativas, con casos de exito y fallo).
7. **Reportes y vistas** — informacion disponible en las 12 vistas: `vw_HistorialApuestas` (11), `vw_ApuestasGanadas` (7), `vw_ApuestasPendientes` (2), `vw_ApuestasPerdidas` (2), `vw_EventosFinalizados` (7), `vw_EventosActivos` (2), `vw_HistorialMovimientos` (27), `vw_SaldoConsolidado` (8), `vw_RankingUsuarios` (8), `vw_ReporteAdministrativo` (9), `vw_ReporteAuditoria` (54), `vw_ReporteFinanciero` (2).
8. **Procedimientos demostrables** — `usp_Saldo_Consultar`, `usp_Apuesta_Historial`, `usp_MovimientoSaldo_Historial`, `usp_Auditoria_Consultar` (consulta); `usp_Apuesta_Liquidar` sobre los eventos pendientes y `usp_Recarga_Crear` sobre cualquier usuario (operacion).

## 5. Escenarios sugeridos para la sustentacion

| # | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| 1 | Consulta de saldo | `EXEC dbo.usp_Saldo_Consultar 3` | 286500 tokens + 50000 PSE |
| 2 | Historial de apuestas | `EXEC dbo.usp_Apuesta_Historial 3` | 2 apuestas ganadas con premio |
| 3 | Movimientos de saldo | `EXEC dbo.usp_MovimientoSaldo_Historial 4` | Recarga, debito y premio encadenados |
| 4 | Ranking de usuarios | `SELECT * FROM vw_RankingUsuarios` | 8 usuarios ordenados por premios |
| 5 | Apuesta nueva | `EXEC dbo.usp_Apuesta_Registrar ...` (evento de jornada 8) | Apuesta pendiente + debito de saldo |
| 6 | Liquidacion por evento | `EXEC dbo.usp_Apuesta_Liquidar @id_evento = 8` | 1 apuesta liquidada + premio/notificacion |

## 6. Re-ejecucion

- El script es **idempotente**: si los usuarios `@apuestadb.co` existen, no inserta nada y lo informa.
- Orden completo: `01` → `02` → `03` → `04` → `05` → (`functions/` → `views/` → `procedures/` → `triggers/`) → `06_demo_data.sql`.
- Ejecucion: `sqlcmd -S "localhost\SQLEXPRESS01" -E -C -I -f 65001 -b -i database\06_demo_data.sql`.
- Credencial de demostracion: los usuarios `@apuestadb.co` reutilizan la credencial de los usuarios de prueba de la Fase 12 (el valor en claro no se versiona).

> **Estado:** cargado y verificado contra SQL Server el 14/sep/2026 (Fase 12.1). Sin errores de FK/CHECK ni de triggers.

---

## 7. Actualización 07/oct/2026 — recuperación de la base

La base se eliminó por error y se recuperó el 07/oct/2026 con la cadena documentada en
`RECUPERACION_FASE13.md`. El dataset quedó **completo y coherente**: 29 de 29 tablas pobladas y
**28 de los 29 conteos coinciden exactamente** con §2.

Única diferencia: **`Auditoria` = 45 filas** (antes 54) y el total pasa de **344 a 335**. Son las
**9 trazas de auditoría** que generó la corrida original de pruebas de la Fase 12 al ejecutar
logins y procedimientos: `Auditoria` es un registro de operaciones, así que su número depende de
cuántas operaciones se auditaron, y esa secuencia no quedó en ningún script. No afecta ningún dato
de negocio.

Los conteos de §2 ya reflejan el estado verificado el 07/oct/2026.
