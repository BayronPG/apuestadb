# Backend — ApuestaDB (sandbox académico)

Backend de Node.js + Express para el sandbox técnico del proyecto ApuestaDB.
Conecta el login/registro del frontend React con la base de datos SQL Server
real (`ApuestaDB` en la instancia local `SQLEXPRESS01`).

> **Estado:** sandbox técnico y académico autorizado por Jhon (02/sep/2026).
> No representa el modelo definitivo ni un avance de fase del proyecto.
> La exportación/generación de Excel fue retirada por decisión de Jhon
> (02/sep/2026): no existe ninguna conexión Excel↔BD.

## Requisitos

- Node.js >= 18 (probado con Node 24).
- SQL Server Express local: instancia `SQLEXPRESS01` con la base `ApuestaDB`
  creada (scripts en `docs/base_datos/`), **protocolo TCP habilitado**
  (puerto 1433) y **modo de autenticación mixto** (SQL + Windows).
  Configuración de una sola vez (requiere PowerShell como administrador):
  - `scripts/habilitar_tcp_sqlexpress01.ps1`
  - `scripts/habilitar_login_mixto.ps1`
  - `scripts/sincronizar_clave_login.ps1` (sincroniza la clave del login
    SQL `apuestadb_app` con `.env`; útil si alguna vez se desincronizan)
- Archivo `.env` creado a partir de `.env.example` (contiene el login SQL
  `apuestadb_app` y el secreto de sesión; no se versiona).

## Puesta en marcha

```bash
npm install
npm start        # http://localhost:3000
npm run pruebas  # bateria de pruebas automatizadas (requiere backend activo)
```

El frontend (Vite, `app/frontend`) reenvía `/api` al backend mediante proxy de
desarrollo (`npm run dev` en `app/frontend`).

## Endpoints

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| GET | `/api/health` | Estado del backend y conexión a BD | — |
| POST | `/api/auth/registro` | Crea usuario (hash bcrypt, evita duplicados) | — |
| POST | `/api/auth/login` | Inicia sesión (cookie httpOnly, bitácora en `Login`) | — |
| GET | `/api/auth/sesion` | Devuelve la sesión activa | sesión |
| POST | `/api/auth/logout` | Cierra la sesión | sesión |

## Estructura

```
src/
  server.js                 # Express, sesion, rutas
  db.js                     # Pool mssql (config desde .env)
  routes/auth.routes.js     # registro, login, sesion, logout
scripts/
  habilitar_tcp_sqlexpress01.ps1  # habilita TCP 1433 (requiere admin, 1 vez)
  pruebas_api.mjs                  # bateria de pruebas automatizadas
```

## Notas técnicas

- Las contraseñas se guardan con **bcrypt** (10 rondas); el hash nunca se
  devuelve al frontend.
- La sesión vive en el servidor (`express-session`); el navegador conserva solo
  la cookie `apuestadb.sid` (httpOnly, sameSite=lax, 8 h). MemoryStore es
  suficiente para el sandbox: reiniciar el backend cierra las sesiones.
- Los usuarios sembrados por el script de datos usan un hash ficticio inválido;
  `npm run pruebas` reemplaza el del admin (`jhon@apuestadb.com`) con un hash
  real de clave de pruebas para poder demostrar el flujo completo.
