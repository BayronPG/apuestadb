# Estrategia de integridad — ApuestaDB (SQL Server · Fase 6)

**Base:** modelo físico (Fases 1–5). Diseño, sin script SQL.
> Objetivo: definir **dónde y cómo** se garantiza cada regla —en el motor, en las transacciones o en el backend— y evitar que la integridad dependa solo de la aplicación.

---

## 1. Principios

1. **Restricción declarativa primero:** todo lo que el motor pueda garantizar (dominio, unicidad, referencias) se declara como restricción.
2. **Separación de responsabilidades:** la base garantiza la **estructura**; el backend garantiza las **reglas de negocio que cruzan tablas** o dependen del tiempo.
3. **Nunca solo en el frontend:** las validaciones críticas se repiten en el backend y, cuando es posible, en la base.
4. **Transaccionalidad:** las operaciones que tocan saldo y apuestas son atómicas (todo o nada).

## 2. Integridad de entidad

- Cada tabla tiene **PK sustituta** `IDENTITY` **no nula** y **única**.
- Las **claves candidatas** naturales se protegen con `UNIQUE` (ver `CLAVES_Y_RESTRICCIONES.md` §3).
- Sin filas duplicadas: las `UNIQUE` compuestas evitan repeticiones en asociativas.

## 3. Integridad referencial

- **Toda FK** apunta a una fila existente (no se permiten huérfanos).
- **`NO ACTION` por defecto** para proteger datos transaccionales.
- **`CASCADE` limitada** a dependientes hoja: RespuestaSeguridad (Usuario), TokenRecuperacion, FavoritoEquipo, Notificacion, HistorialCuota (OpcionApuesta), CalendarioArbitro (Evento).
- **`ON UPDATE = NO ACTION`** en todas (las PK sustitutas no cambian).
- **Sin rutas de cascada múltiple:** solo se permite un camino de cascada hacia una misma tabla.
- **FK compuesta** `Apuesta(id_usuario, id_tipo_saldo) → SaldoCuenta` garantiza que la cuenta afectada existe y pertenece al usuario y tipo indicados.

## 4. Integridad de dominio

- **`CHECK`** para enumerados y rangos (monto > 0, saldos ≥ 0, cuotas > 0, marcadores ≥ 0, fechas coherentes, equipos distintos, origen de movimiento excluyente).
- **`DEFAULT`** para estados y marcas de tiempo (`SYSDATETIME()`).
- **Longitudes/unicode** fijadas en `TIPOS_DATOS.md` (evitan truncamientos silenciosos).

## 5. Reglas de negocio que superan el alcance de `CHECK`

Estas reglas **no** se pueden expresar como restricción declarativa y se implementan en **transacción/backend**:

| Regla | Motivo |
|---|---|
| `Apuesta.monto ≤ SaldoCuenta.saldo_actual` del tipo elegido | depende de otra tabla (RN-08) |
| Coherencia opción → mercado → evento en curso | cruce de varias tablas (RN-17, RN-09) |
| Fechas "no futuras" (`fecha_registro`, `fecha_fundacion`) | `GETDATE()` no es determinista en `CHECK` |
| Cuota congelada y no recalculada | regla de proceso (RN-10/RN-11) |
| Actualización coordinada de `saldo_actual` y `MovimientoSaldo` | atomicidad (RN-18, RN-19) |
| Un solo tipo de saldo por apuesta y premio al mismo tipo | regla de negocio (RN-03/RN-04) |

## 6. Integridad transaccional (procesos)

| # | Proceso | Atomicidad requerida |
|---|---|---|
| P-01 | Registrar apuesta | insertar Apuesta **+** descontar SaldoCuenta **+** insertar MovimientoSaldo **+** (si aplica) HistorialCuota | una transacción |
| P-02 | Recargar saldo | insertar Recarga **+** actualizar SaldoCuenta **+** insertar MovimientoSaldo | una transacción |
| P-03 | Liquidar apuesta | insertar Liquidacion **+** abonar SaldoCuenta **+** insertar MovimientoSaldo **+** actualizar estado de Apuesta | una transacción |
| P-04 | Registrar usuario | insertar Usuario **+** crear cuentas SaldoCuenta (tokens y PSE en 0) | una transacción |
| P-05 | Cambiar cuota | actualizar OpcionApuesta.cuota_vigente **+** insertar HistorialCuota | una transacción |

**Nivel de aislamiento:** `READ COMMITTED` por defecto; para P-01/P-03 se usan **bloqueos explícitos** sobre la cuenta de saldo.

## 7. Concurrencia

- **Riesgo:** dos apuestas simultáneas del mismo usuario podrían leer el mismo saldo y sobregirarlo (actualización perdida).
- **Patrón recomendado:** dentro de la transacción, leer la cuenta con `WITH (UPDLOCK, ROWLOCK)` antes de validar y descontar; serializar así las operaciones de una misma cuenta.
- **Alternativa:** concurrencia optimista con una columna `rowversion` en `SaldoCuenta` (opcional, no altera el número de tablas).
- **Sin bloqueos prolongados:** transacciones cortas; el cálculo de premios se resuelve antes de abrir la transacción de escritura.

## 8. Snapshots controlados

Los 5 valores derivados (`OpcionApuesta.cuota_vigente`, `SaldoCuenta.saldo_actual`, `MovimientoSaldo.saldo_resultante`, `Liquidacion.monto_premio`, `Liquidacion.resultado_liquidacion`) se **escriben en la misma transacción** del hecho que los origina. Regla de oro: **no se recalculan retroactivamente**; si se corrigen, se hace por un movimiento nuevo.

## 9. Auditoría

- La tabla `Auditoria` se alimenta desde el **backend** en las operaciones importantes (login, apuesta, liquidación, cambios administrativos).
- La **automatización por triggers** queda fuera de esta fase y se evaluará más adelante (no se generan triggers ahora).
- `id_usuario` es opcional para registrar operaciones automáticas del sistema.

## 10. Qué se difiere a las siguientes fases

- **Script DDL** (`CREATE DATABASE`, `CREATE TABLE`, restricciones e índices).
- **Vistas, funciones, procedimientos y triggers**.
- **Datos de prueba** y **consultas** (básicas y avanzadas).
- **Roles y permisos** (seguridad de la base).

---

## 11. Matriz de cumplimiento de reglas de negocio (RN-01..RN-21)

| Regla | Garantizada por |
|---|---|
| RN-01 saldo por tipos | TipoSaldo + SaldoCuenta (estructura) |
| RN-02 saldo inicial en cero | DEFAULT 0 + proceso P-04 |
| RN-03 un solo tipo por apuesta | FK `Apuesta.id_tipo_saldo` (un valor) |
| RN-04 premio al mismo tipo | proceso P-03 |
| RN-05 sin conversión | inexistencia de estructura de conversión |
| RN-06 recarga de ambos tipos | `Recarga.id_tipo_saldo` |
| RN-07 monto > 0 | `CK_Apuesta_monto` |
| RN-08 monto ≤ saldo | transacción/backend (P-01) |
| RN-09 evento válido | proceso P-01 + `Evento.estado` |
| RN-10 cuota congelada | proceso P-01 + `Apuesta.cuota_congelada` |
| RN-11 cuota no altera apuesta | proceso P-01/P-05 |
| RN-12/RN-13 atomicidad | transacciones P-01 |
| RN-14 una liquidación | `UQ_Liquidacion` |
| RN-15 resultado oficial | FK `Resultado` + proceso P-03 |
| RN-16 no jugar contra sí mismo | `CK_Evento_equipos` |
| RN-17 opción → mercado → evento | FKs de la cadena |
| RN-18 todo cambio genera movimiento | proceso + backend |
| RN-19 trazabilidad | MovimientoSaldo + Auditoria |
| RN-20 contraseña protegida | `Usuario.contrasena` (hash) |
| RN-21 fechas y estados válidos | `CHECK` + backend |
