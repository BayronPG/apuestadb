# MySQL — catálogo deportivo (Fase 15)

Esquema MySQL 8 del **catálogo deportivo** de ApuestaDB: 15 tablas migradas desde SQL Server
más la tabla nueva **Jugador** (16 en total). SQL Server conserva el sistema funcional.

## Archivos

| Archivo | Contenido |
|---|---|
| `01_schema.sql` | Base `apuestadb`, 16 tablas InnoDB/utf8mb4 y 2 vistas de eventos. |
| `02_constraints_indexes.sql` | UNIQUE, CHECK, FOREIGN KEY e índices (idempotente). |
| `03_seed.sql` | Semilla ficticia de `Jugador` (2 por equipo, idempotente). |
| `04_migrate.js` | Migración de las 15 tablas desde SQL Server (solo lectura). |
| `05_verify.sql` | Conteos, huérfanos, RN-16 y validaciones de Jugador. |

## Orden de ejecución

```bash
# 1) esquema y restricciones
docker exec -i apuestadb-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < database/mysql/01_schema.sql
docker exec -i apuestadb-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < database/mysql/02_constraints_indexes.sql

# 2) migración (requiere MYSQL_* en el entorno del proceso)
node database/mysql/04_migrate.js

# 3) semilla de Jugador y verificación
docker exec -i apuestadb-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < database/mysql/03_seed.sql
docker exec -i apuestadb-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < database/mysql/05_verify.sql
```

Todos los scripts son idempotentes: pueden ejecutarse dos veces sin duplicar datos.

## Decisiones

- **Estadio = cancha** solicitada por el profesor; no se crea la tabla `Cancha`.
- **Jugador** es una tabla nueva del catálogo, depende de `Equipo` y no interviene en apuestas,
  mercados, resultados ni saldos.
- **FavoritoEquipo.id_usuario** es una referencia lógica a `Usuario` en SQL Server (sin FK).
- **Resultado** permanece junto a `Evento` en MySQL.
- PostgreSQL y MongoDB **no** se modifican en esta fase; su migración queda pendiente.

## Notas de traducción

IDENTITY → `AUTO_INCREMENT` · NVARCHAR → `VARCHAR` utf8mb4 · DATETIME2(3) → `DATETIME(3)` ·
DECIMAL conserva precisión/escala · fechas automáticas → `CURRENT_TIMESTAMP` · InnoDB +
`utf8mb4_0900_ai_ci`.

La migración conserva los identificadores originales y convierte las fechas a UTC para no
perder milisegundos.
