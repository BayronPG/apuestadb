# Entrega segura — Azure App Service + Docker local

**Fecha:** 08/nov/2026 · **Rama:** `poliglota`

## 1. URL pública

**https://app-apuestadb-bayron-hkgefxhpfhasbfcu.brazilsouth-01.azurewebsites.net**

> Azure generó el sufijo porque el nombre `app-apuestadb-bayron` ya estaba tomado. Es el hostname
> real del App Service desplegado por GitHub Actions (run `42531452735`).

## 2. Estado verificado

| Ruta | Resultado |
|---|---|
| `GET /` | **200** (SPA React servida por Express) |
| `GET /login` | **200** (fallback SPA) |
| `GET /api/health` | **200**, `entorno = production`, `estado = degradado` |

`degradado` es el resultado esperado: la API responde y SQL Server conecta, pero MySQL,
PostgreSQL y MongoDB no están disponibles en Azure.

## 3. Por qué las bases no están en Azure

- Cuota **Compute 0** en la suscripción: impide crear MySQL/PostgreSQL Flexible Server,
  Cosmos DB y máquinas virtuales.
- Política regional que bloquea esos recursos en la región del App Service.

Por decisión de alcance, **no** se crean recursos de base de datos en Azure. El App Service
(F1, público) sirve frontend y backend; la API degrada sin romper `/api/health`.

## 4. Demostración multibase

La arquitectura completa (SQL Server, MySQL, PostgreSQL y MongoDB con sagas) se demuestra
**localmente con Docker**:

```bash
docker compose --env-file .env.docker up -d
cd backend && npm start
```

- `GET /api/health` → `operativo` 4/4.
- Catálogo MySQL, finanzas PostgreSQL, documentos MongoDB y auth SQL Server.
- Scripts: `database/mysql/`, `database/postgresql/`, `database/mongodb/`.

## 5. Seguridad de la entrega

- Repositorio privado; sin `.env`, `.env.docker` ni `.env.azure` versionados.
- Secretos de Azure solo en App Settings y GitHub Secrets (`AZURE_WEBAPP_PUBLISH_PROFILE`).
- `AZURE_WEBAPP_NAME` y `VITE_API_URL` son GitHub Variables, no secretos.
- Única superficie pública: Nginx/App Service; las bases locales no publican puertos en Azure.
- F1 es un plan gratuito de demostración: sin SLA ni escalado, adecuado solo para la entrega.

## 6. Alcance declarado

- Entregado: frontend + API en un único App Service, con health y SPA.
- Demostrable en local: multibase completo, sagas y liquidación.
- No entregado en Azure: bases administradas, SSO, Drive, Wompi y Firebase (sin cuota/credenciales).
