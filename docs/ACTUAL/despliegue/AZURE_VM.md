# Despliegue en Azure VM con Docker Compose

**Fecha:** 08/nov/2026 · **Archivo:** `docker-compose.azure.yml`

## Arquitectura

```
Internet → Nginx :80 → /        → SPA React (dist)
                      → /api/   → backend :4000
                                    ├── sqlserver :1433  (interno)
                                    ├── mysql :3306      (interno)
                                    ├── postgres :5432   (interno)
                                    └── mongo :27017     (interno)
```

- Solo **Nginx** publica puerto (`${NGINX_PORT:-8080}:80`). En la VM usar `NGINX_PORT=80`.
- Las cuatro bases viven en la red `interna` (sin puertos públicos); Nginx y backend comparten `web`.
- `restart: unless-stopped` en servicios permanentes; healthchecks en todos.

## Archivos

| Archivo | Uso |
|---|---|
| `backend/Dockerfile` | Node 20 Alpine, `npm ci --omit=dev`, puerto 4000. |
| `frontend/Dockerfile` | Build Vite + Nginx 1.27 Alpine. |
| `frontend/nginx.azure.conf` | Proxy `/api/` al backend y fallback SPA. |
| `docker-compose.azure.yml` | Stack completo (proyecto `apuestadb-azure`). |
| `.env.azure.example` | Plantilla; copiar a `.env.azure` (ignorado por Git). |

## Puesta en marcha en la VM

```bash
cp .env.azure.example .env.azure
# completar secretos; NGINX_PORT=80 y CORS_ORIGINS=http://<IP pública>
docker compose -f docker-compose.azure.yml --env-file .env.azure up -d --build
```

## Inicialización de SQL Server

El servicio `sqlserver-init` aplica `database/01..05`, funciones, vistas, procedimientos y
triggers. Si la base ya existe (`dbo.Rol` presente) omite la carga (idempotente).

`06_demo_data.sql` se intenta al final y es **opcional**: requiere una credencial demo de
referencia que no se versiona. Si falta, el stack continúa y se informa en el log.

## Pruebas locales realizadas (08/nov/2026)

| Prueba | Resultado |
|---|---|
| `docker compose config -q` | Válido |
| Build backend y frontend | OK (Vite 352,57 kB / gzip 105,87 kB) |
| `GET /` | 200 (SPA) |
| `GET /login` | 200 (fallback SPA) |
| `GET /api/health` | 200, operativo 4/4 |
| Registro + login a través de Nginx | 201 / 200 |

## Pendientes para la VM

- **Bootstrap de MySQL, PostgreSQL y MongoDB**: este compose levanta los motores, pero no
  ejecuta `database/mysql/`, `database/postgresql/` ni `database/mongodb/`. Deben aplicarse
  una vez (scripts y migraciones) antes de la demo; el backend expondrá errores de tablas
  inexistentes hasta entonces.
- `06_demo_data.sql` requiere definir la credencial demo en el servidor.
- TLS/dominio (Certbot o Azure Front Door) y respaldos programados.
