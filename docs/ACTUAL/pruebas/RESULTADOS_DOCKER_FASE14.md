# Resultados Docker — Fase 14 (PT-14-01)

## Fecha y hora local
2026-11-08 10:23 (America/Bogota)

## Entorno
- Espacio libre en C: 20.79 GB
- Docker Engine: 29.9.2 (linux/amd64)
- Docker Desktop: 4.97.0
- Docker Compose: v5.6.1
- Proyecto: `C:\Proyectos\ApuestaDB`, rama `poliglota`

## Imágenes y arquitecturas
| Imagen | Digest resumido | OS/Arch |
|---|---|---|
| mcr.microsoft.com/mssql/server:2022-latest | cf8f0ab2ebe6 | linux/amd64 |
| mysql:8 | a81d043930e5 | linux/amd64 |
| postgres:16 | f9a7b9ebf6f5 | linux/amd64 |
| mongo:7 | 8bb4442761a6 | linux/amd64 |

Las cuatro imágenes se descargaron sin errores de formato de ejecución.

## Servicios publicados y estado
| Servicio | Estado | Puerto host → contenedor |
|---|---|---|
| sqlserver | running / healthy | 1434 → 1433 |
| mysql | running / healthy | 3307 → 3306 |
| postgres | running / healthy | 5432 → 5432 |
| mongo | running / healthy | 27017 → 27017 |

MySQL queda publicado en el host en el puerto **3307**.

## Comprobaciones internas (4/4)
- SQL Server: `SELECT 1` → OK (1)
- MySQL: `mysqladmin ping` → OK (mysqld is alive)
- PostgreSQL: `pg_isready` → OK (accepting connections)
- MongoDB: `db.adminCommand({ping:1}).ok` → OK (1)

## Contexto
- Compose con los cuatro motores: commit `90104a7`.
- Cambio de MySQL a host 3307: commit `6423ea6`.
- Diagnostic ID previo: `4A7E3741-4FD8-4C06-B481-08D9414A04BD/20261108081348`.
- Se ejecutó **Clean up data** de WSL 2 para corregir la corrupción de capas que provocaba `exec format error` en MySQL y MongoDB.
- No se ejecutaron migraciones ni scripts SQL; el backend aún no consume los motores nuevos.

## Notas
- No se registran credenciales, usuarios ni cadenas de conexión en este documento.
- Los cuatro contenedores quedan levantados y healthy.
