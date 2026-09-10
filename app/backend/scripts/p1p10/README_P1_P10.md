# Migracion P1-P10 - ApuestaDB (sandbox)

Fecha: 09/sep/2026 · Autorizacion: Jhon Bayron Pelaez Guerra (explicita)
Estado: APLICADA y VALIDADA en `SQLEXPRESS01\ApuestaDB`. Sin commit ni push.
Respaldo previo: `app/backend/backups/ApuestaDB_bak_20260909_1917.bak`.

## Archivos de la migracion (app/backend/scripts/p1p10/)
- `migracion_p1_p10.sql` — parte A (P1-P5 + columna/FK de P6).
- `migracion_p1_p10_b.sql` — parte B (P6 corregido, P7, P8, P9, P10 paso 1).
- `paso_final_p10.sql` — P10 paso 2: retiro de UNIQUE(numero_documento) simple.
- `migracion_p1_p10_rollback.sql` — rollback por pasos (o restaurar el .bak).
- `validacion.sql` — verificaciones post-migracion (FK, constraints, mapeos).
- `diag.sql` — diagnostico previo (sin cambios).

## Cambios aplicados
| P | Cambio | Detalle |
|---|--------|---------|
| P1 | `Calendario.estadio_id` FK → Estadio | Backfill con sede del equipo local (conocida) |
| P2 | `Equipo.estadio_id` FK → Estadio | Sede principal; backfill solo con estadios reales del seed |
| P3 | `Temporada.liga_id` FK → Liga | `deporte_id` se conserva en transicion (redundancia documentada) |
| P4 | `Calendario.temporada_id` FK → Temporada | Backfill por liga + rango de fechas |
| P5 | `Liga.pais_id` FK → Pais | Se creo Pais 'Internacional' (iso NULL); texto `pais` transitorio |
| P6 | `LogPago.recarga_id` FK → Recarga + indice unico filtrado | 1 recarga aprobada → a lo sumo 1 movimiento (NULLs multiples permitidos) |
| P7 | `Notificacion.hacer_apuesta_id` / `recarga_id` (FK, nul) + CHECK `CK_Notificacion_OrigenUnico` | Origen real; sin polimorfismo; promocionales/sistema sin entidad |
| P8 | `Servicios.empresa_id` y `Reglas.empresa_id` FK → Empresa | Justificacion: la operadora principal ofrece servicios y emite reglas |
| P9 | Login = unica bitacora de accesos | Se retiro el registro `LOGIN` historico de Auditoria (respaldado) y el valor del CHECK (`CK_Auditoria_Operacion`: INSERT/UPDATE/DELETE) |
| P10 | `UQ_Usuario_TipoNumeroDoc` UNIQUE(tipo_documento, numero_documento) | Retirada la UNIQUE simple sobre numero_documento tras validar backend/datos/pruebas |

## Validacion
- 29 tablas de dominio conectadas (0 aisladas; solo sysdiagrams, del sistema).
- Bateria de pruebas: **23/23 PASS** (15 originales + 8 nuevas: P10 por API con tipos CC/CE, e integridad P1-P10 por SQL).
- Registro y login verificados con la regla documental actualizada (mensajes por tipo y numero).
- Notificaciones validadas con y sin entidad de origen; Auditoria sin LOGIN (0).

## Valores NULL intencionales (documentados)
- Temporada 'Copa del Rey 2026' sin liga (mapeo pendiente de decision, no asumido).
- Eventos NBA de sep/2026 fuera de la ventana de la temporada NBA 2026-27.
- Eventos/equipos sin sede conocida en el seed (America, Deportivo Cali, NBA, La Equidad).
- LogPago recarga 30000 (jhon, tokens) sin solicitud aprobada correspondiente en seeds.

## Notas
- `docs/base_datos/diagramas_er/apuestadb_er.mmd` actualizado con las 10 relaciones P1-P10; el `.png` debe regenerarse desde el `.mmd` cuando se disponga de Mermaid CLI (pendiente).
- Dato preexistente documentado (no modificado): Reglas tiene duplicado 'monto_minimo_apuesta' (filas 1-2); su limpieza queda pendiente de decision de Jhon.
- Dashboard sin modificar; sin dependencias nuevas; sin commit ni push.
