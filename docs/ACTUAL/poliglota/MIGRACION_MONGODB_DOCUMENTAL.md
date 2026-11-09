# Migración documental a MongoDB — Fase 17

**Fecha:** 08/nov/2026 · **Rama:** `poliglota` · **Estado:** migración completa + saga de apuestas.

## 1. Alcance

- 4 colecciones migradas desde SQL Server: `apuesta`, `liquidacion`, `notificacion`, `auditoria`.
- **108 documentos** con identificadores originales conservados.
- Backend con selección `APUESTAS_MOTOR=sqlserver|mongodb` (predeterminado `sqlserver`).
- Saga de creación de apuesta: PostgreSQL (débito) + MongoDB (documento), con compensación.
- MySQL, frontend y el worktree Azure no se modifican.

## 2. Inventario y resultado

| Colección | Origen | Destino | IDs distintos | Suma de ids |
|---|---:|---:|---:|---:|
| apuesta | 11 | 11 | 11 | 66 |
| liquidacion | 9 | 9 | 9 | 45 |
| notificacion | 14 | 14 | 14 | 105 |
| auditoria | 74 | 74 | 74 | 2775 |

- Migración ejecutada dos veces: idempotente (upsert por id), sin duplicados.
- Fechas almacenadas como `Date`; `BIGINT` de SQL Server normalizado a número.
- Índices: único `id_apuesta`, único disperso `clave_idempotencia`, `id_usuario+estado`,
  fecha descendente; análogos en las demás colecciones.

## 3. Saga de apuesta (PostgreSQL + MongoDB)

1. Validación de la opción en el catálogo (MySQL): mercado abierto, opción habilitada, evento no iniciado.
2. Débito en PostgreSQL con `fn_movimiento_saldo` y clave `apuesta:<clave>` (idempotente).
3. Inserción del documento en MongoDB (id generado por contador, cuota congelada,
   `id_movimiento` y `clave_idempotencia`).
4. Si el paso 3 falla: crédito de `ajuste` con clave `comp:<clave>` y respuesta 503.

La clave repetida devuelve la apuesta existente sin volver a debitar. No se declara ACID entre
motores; la saga Mongo (apuestas) queda implementada con compensación explícita.

## 4. Verificación

| Control | Resultado |
|---|---|
| Inicialización idempotente | OK |
| Migración dos veces | OK |
| Conteos, IDs y sumas | OK |
| Creación de apuesta (saga) | 201, débito único |
| Clave repetida | mismo `id_apuesta`, sin segundo débito |
| Saldo insuficiente | 409, sin documento |
| Compensación (fallo simulado de Mongo) | saldo restaurado, 2 movimientos (débito + crédito) |
| Lecturas Mongo (`/api/apuestas`, pendientes) | 200 |
| Respaldo `APUESTAS_MOTOR=sqlserver` | 7/7 endpoints 200 |
| Datos de prueba | restaurados (PG 1.247.500 / 1.897.500; Mongo 108 documentos) |

## 5. Fase 17.1 — liquidaciones, notificaciones y auditoría

`DOCUMENTOS_MOTOR=sqlserver|mongodb` (predeterminado `sqlserver`) controla estos tres dominios
sin cambiar los contratos HTTP.

- **Liquidación:** resultado oficial y ganador desde MySQL; premio acreditado en PostgreSQL con el
  mismo `id_tipo_saldo` de la apuesta; documento en MongoDB con **id_apuesta único** (índice
  `uq_liquidacion_apuesta`) e **idempotencia** por clave `liquidacion:<id>`. Un duplicado no repite
  el pago.
- **Compensación:** si falla la inserción del documento, el premio se revierte con un débito
  (`apuesta`) y la operación devuelve 503. Si otra ejecución ya reservó la liquidación, no se
  compensa.
- **Notificaciones y auditoría:** se escriben y leen en MongoDB cuando el motor es `mongodb`.
- **Concurrencia:** dos liquidaciones simultáneas producen una sola liquidación y un solo premio.

Verificado: liquidación, duplicado, premio, notificación, auditoría, fallo simulado con
compensación, concurrencia y lecturas; respaldo SQL Server 8/8 endpoints 200.

Pendiente: reintentos automáticos y outbox de eventos.
