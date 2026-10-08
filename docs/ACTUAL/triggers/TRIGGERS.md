# Triggers — ApuestaDB (Fase 9)

**Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia) · **Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García
**Motor:** SQL Server · **Ubicación:** `database/triggers/`
**Restricciones de la fase:** no se modifican tablas, vistas, funciones ni procedimientos. Solo se crean y documentan triggers.

---

## 1. Orden de ejecución

> Ejecutar **después** de `database/01..05` (tablas), las funciones, las vistas y los procedimientos.

1. `01_auditoria.sql` → 2. `02_saldo.sql` → 3. `03_cuotas.sql` → 4. `04_resultados.sql` → 5. `05_liquidacion.sql`

## 2. Resumen (13 triggers)

| # | Trigger | Tabla | Evento | Archivo |
|---|---|---|---|---|
| 1 | `trg_Usuario_Auditoria` | Usuario | UPDATE, DELETE | 01_auditoria |
| 2 | `trg_Evento_Auditoria` | Evento | INSERT, UPDATE, DELETE | 01_auditoria |
| 3 | `trg_Mercado_Auditoria` | Mercado | INSERT, UPDATE, DELETE | 01_auditoria |
| 4 | `trg_OpcionApuesta_Auditoria` | OpcionApuesta | UPDATE, DELETE | 01_auditoria |
| 5 | `trg_MovimientoSaldo_SincronizarSaldo` | MovimientoSaldo | INSERT | 02_saldo |
| 6 | `trg_SaldoCuenta_Proteger` | SaldoCuenta | UPDATE, DELETE | 02_saldo |
| 7 | `trg_MovimientoSaldo_NoEliminar` | MovimientoSaldo | DELETE | 02_saldo |
| 8 | `trg_OpcionApuesta_HistorialCuota` | OpcionApuesta | INSERT, UPDATE | 03_cuotas |
| 9 | `trg_HistorialCuota_NoEliminar` | HistorialCuota | DELETE | 03_cuotas |
| 10 | `trg_Resultado_Consistencia` | Resultado | INSERT, UPDATE | 04_resultados |
| 11 | `trg_Resultado_NoEliminar` | Resultado | DELETE | 04_resultados |
| 12 | `trg_Liquidacion_Validar` | Liquidacion | INSERT, UPDATE | 05_liquidacion |
| 13 | `trg_Liquidacion_NoEliminar` | Liquidacion | DELETE | 05_liquidacion |

**Cobertura de los eventos solicitados:**

| Evento a automatizar | Trigger(s) |
|---|---|
| Auditoría automática de cambios | 1, 2, 3, 4 |
| Historial automático de cuotas | 8 |
| Registro/actualización de movimientos y saldo consolidado | 5, 6 |
| Validación de liquidaciones | 12 |
| Control de consistencia de resultados | 10 |
| Control de eliminación de registros críticos | 7, 9, 11, 13 (+ 6 para cuentas) |
| Trazabilidad de operaciones administrativas | 2, 3, 4 (login en la descripción) |

## 3. Fichas detalladas

### 1. trg_Usuario_Auditoria
- **Tabla / Evento:** Usuario · UPDATE, DELETE
- **Objetivo:** trazar modificaciones y bajas de usuarios (el alta la audita `usp_Usuario_Registrar`).
- **Riesgos:** crecimiento de `Auditoria`; el borrado de un usuario con dependencias ya lo bloquea la integridad referencial.
- **Rendimiento:** bajo (una inserción de auditoría por sentencia, no por fila… salvo lotes grandes).

### 2. trg_Evento_Auditoria
- **Tabla / Evento:** Evento · INSERT, UPDATE, DELETE
- **Objetivo:** trazabilidad de operaciones administrativas sobre el calendario.
- **Riesgos:** registra también la actualización de estado que hace `usp_Evento_RegistrarResultado` (dos filas de auditoría con significado distinto: acción de negocio y cambio de fila).
- **Rendimiento:** bajo-medio; `Evento` se actualiza en cada resultado.

### 3. trg_Mercado_Auditoria
- **Tabla / Evento:** Mercado · INSERT, UPDATE, DELETE
- **Objetivo:** trazar apertura, cierre y anulación de mercados.
- **Riesgos:** volumen de auditoría si se cargan muchos mercados por lote.
- **Rendimiento:** bajo.

### 4. trg_OpcionApuesta_Auditoria
- **Tabla / Evento:** OpcionApuesta · UPDATE, DELETE
- **Objetivo:** trazar cambios de estado y borrados de opciones.
- **Riesgos:** convivencia con el trigger de historial de cuota (8) en el mismo evento `UPDATE` (orden no garantizado; no interfieren).
- **Rendimiento:** bajo.

### 5. trg_MovimientoSaldo_SincronizarSaldo
- **Tabla / Evento:** MovimientoSaldo · INSERT
- **Objetivo:** mantener `SaldoCuenta.saldo_actual` igual al `saldo_resultante` del último movimiento (saldo consolidado automático).
- **Riesgos:** si un proceso actualizara `SaldoCuenta` sin insertar movimiento, el trigger no lo detecta; doble escritura sobre `SaldoCuenta` (procedimiento + trigger) aunque **idempotente** (mismo valor).
- **Rendimiento:** bajo-medio (una lectura de `inserted` con `ROW_NUMBER` y un `UPDATE` por cuenta afectada).

### 6. trg_SaldoCuenta_Proteger
- **Tabla / Evento:** SaldoCuenta · UPDATE, DELETE
- **Objetivo:** impedir saldos negativos y la eliminación de cuentas de saldo.
- **Riesgos:** puede bloquear procesos legítimos de corrección si intentan borrar cuentas (deseado); el `UPDATE` también lo dispara el propio procedimiento de saldo (valida y permite).
- **Rendimiento:** muy bajo (solo lectura de `inserted`/`deleted`).

### 7. trg_MovimientoSaldo_NoEliminar
- **Tabla / Evento:** MovimientoSaldo · DELETE
- **Objetivo:** los movimientos de saldo son inmutables (trazabilidad, RN-19).
- **Riesgos:** impide cualquier depuración de datos; debe considerarse en pruebas.
- **Rendimiento:** insignificante (solo se activa en `DELETE`).

### 8. trg_OpcionApuesta_HistorialCuota
- **Tabla / Evento:** OpcionApuesta · INSERT, UPDATE
- **Objetivo:** registrar automáticamente la cuota al crear la opción y en cada cambio (RN-10/RN-11).
- **Riesgos:** en cargas masivas puede insertar muchas filas en `HistorialCuota`; si el cambio no varía la cuota, no inserta (correcto).
- **Rendimiento:** bajo-medio; una inserción por opción creada o modificada.

### 9. trg_HistorialCuota_NoEliminar
- **Tabla / Evento:** HistorialCuota · DELETE
- **Objetivo:** historial inmutable (trazabilidad de cuotas).
- **Riesgos:** ninguna operación legítima depende del borrado.
- **Rendimiento:** insignificante.

### 10. trg_Resultado_Consistencia
- **Tabla / Evento:** Resultado · INSERT, UPDATE
- **Objetivo:** impedir resultados de eventos cancelados/suspendidos, marcadores negativos y más de un resultado por evento.
- **Riesgos:** **no exige** que el evento esté `finalizado` al insertar (para no romper `usp_Evento_RegistrarResultado`, que finaliza el evento inmediatamente después); un resultado oficial podría registrarse sobre un evento aún "programado" si se usa INSERT directo.
- **Rendimiento:** bajo (una lectura de `Evento` y validaciones sobre `inserted`).

### 11. trg_Resultado_NoEliminar
- **Tabla / Evento:** Resultado · DELETE
- **Objetivo:** impedir borrar resultados oficiales o con liquidaciones; permite borrar un `provisional` sin liquidaciones.
- **Riesgos:** permite borrar provisionales (por diseño); el criterio depende del estado.
- **Rendimiento:** insignificante.

### 12. trg_Liquidacion_Validar
- **Tabla / Evento:** Liquidacion · INSERT, UPDATE
- **Objetivo:** exigir resultado oficial, coincidencia evento–apuesta, coherencia del premio (ganada: monto × cuota; perdida: 0) y una sola liquidación por apuesta (RN-14).
- **Riesgos:** valida la **fórmula** del premio; si el negocio cambiara las reglas de pago, habría que ajustar el trigger; convivencia con `usp_Apuesta_Liquidar` (que ya calcula ese valor, por lo que pasa).
- **Rendimiento:** medio (varias uniones sobre `inserted` en cada liquidación; `usp_Apuesta_Liquidar` liquida en lote).

### 13. trg_Liquidacion_NoEliminar
- **Tabla / Evento:** Liquidacion · DELETE
- **Objetivo:** las liquidaciones son inmutables (trazabilidad del cierre).
- **Riesgos:** ninguna operación legítima depende del borrado.
- **Rendimiento:** insignificante.

---

## 4. Interacción con los procedimientos (evitar duplicidad)

Este fue el punto crítico del diseño. Los procedimientos de la Fase 7 **ya** realizan auditoría, registro de movimientos y actualización de saldo. Por eso:

| Riesgo detectado | Decisión aplicada |
|---|---|
| Un trigger que "registre el movimiento" al actualizar `SaldoCuenta` duplicaría el movimiento de `usp_MovimientoSaldo_Registrar`. | **No se creó**. En su lugar, `trg_MovimientoSaldo_SincronizarSaldo` sincroniza el saldo consolidado a partir del movimiento insertado. |
| Un trigger de auditoría sobre las tablas transaccionales duplicaría los registros que ya escriben los procedimientos. | La auditoría automática se limita a **Usuario (UPDATE/DELETE)** y **catálogos** (Evento, Mercado, OpcionApuesta), que los procedimientos no auditan. |
| Un trigger que exija `Evento.estado = 'finalizado'` al insertar `Resultado` rompería el orden interno de `usp_Evento_RegistrarResultado`. | El control de consistencia valida solo *cancelado/suspendido* y marcadores. |
| Un trigger que recalcule `SaldoCuenta.saldo_actual` podría chocar con la escritura del procedimiento. | La sincronización es **idempotente**: escribe el mismo `saldo_resultante`. |

**Conclusión:** los triggers **complementan** a los procedimientos, no los duplican.

## 5. Buenas prácticas aplicadas

- **`inserted` / `deleted`:** uso de las pseudotablas para distinguir INSERT (solo `inserted`), UPDATE (ambas) y DELETE (solo `deleted`).
- **Manejo multi-fila:** todas las sentencias son **conjuntos** (sin cursores ni suposiciones de una sola fila); `trg_MovimientoSaldo_SincronizarSaldo` usa `ROW_NUMBER()` para tomar el último movimiento por cuenta.
- **`TRY/CATCH`:** se aplica en los triggers que **escriben** (auditoría, historial, sincronización), convirtiendo el fallo en un mensaje claro. Los triggers **validadores** usan `THROW` directo, porque su propósito es abortar la operación.
- **THROW con códigos:** 50200–50224, para identificar el punto de fallo.
- **Sin modificaciones de esquema:** no se alteran tablas, vistas, funciones ni procedimientos.

## 6. Riesgos generales y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Duplicidad de registros** con los procedimientos | Alto | Diseño sin solapamiento (sección 4) |
| **Rendimiento** en cargas masivas (auditoría e historial) | Medio | Inserción por sentencia, no por fila; índices ya previstos |
| **Crecimiento de `Auditoria`** | Medio | Depuración/archivado periódico (fase futura) |
| **Orden no garantizado** entre triggers del mismo evento | Bajo | Los triggers de OpcionApuesta no interfieren entre sí |
| **`THROW` en trigger aborta la sentencia/transacción** | Esperado | Es el comportamiento deseado (integridad primero) |
| **Anidamiento de triggers** | Bajo | Profundidad máxima 2 (MovimientoSaldo → SaldoCuenta); sin recursión |
| **Dependencia de la fórmula del premio** en `trg_Liquidacion_Validar` | Medio | Documentado; ajustar si cambian las reglas de pago |
| **Borrado permitido de `Resultado` provisional** | Bajo | Permitido por diseño (aún no oficial) |

## 7. Estado y pendientes

- **13 triggers** creados y documentados. **Nada modificado** en tablas, vistas, funciones ni procedimientos.
- **No ejecutados** contra la instancia en esta sesión.
- **Pendiente:** datos de prueba ampliados, consultas avanzadas y **backend Node.js**.
