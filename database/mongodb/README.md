# MongoDB — dominio documental (Fase 17)

Colecciones `apuesta`, `liquidacion`, `notificacion` y `auditoria`, migradas desde SQL Server
(108 documentos). El dinero sigue en PostgreSQL; la creación de apuestas usa una saga.

## Archivos

| Archivo | Contenido |
|---|---|
| `01_init.js` | Colecciones, validador JSON de `apuesta` e índices (idempotente). |
| `02_migrate.js` | Migración desde SQL Server, upsert por id, BIGINT normalizado a número. |
| `03_verify.js` | Conteos, sumas, IDs distintos y tipo de fecha. |

## Ejecución

```bash
MONGO_URI=... MONGO_DATABASE=apuestadb node database/mongodb/01_init.js
MONGO_URI=... MONGO_DATABASE=apuestadb node database/mongodb/02_migrate.js
MONGO_URI=... MONGO_DATABASE=apuestadb node database/mongodb/03_verify.js
```

## Backend

- `APUESTAS_MOTOR=sqlserver` (predeterminado): procedimientos actuales.
- `APUESTAS_MOTOR=mongodb`: lectura de apuestas en MongoDB y creación con saga
  PostgreSQL (débito idempotente) + MongoDB; si falla la inserción se compensa con un crédito.
- `liquidar` sigue en SQL Server (Fase 17.1).

## Índices

`apuesta`: único `id_apuesta`, único disperso `clave_idempotencia`, `id_usuario+estado`,
`fecha_hora_registro`. Resto de colecciones: único por id y búsquedas por usuario/fecha.
