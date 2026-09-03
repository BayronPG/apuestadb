# ApuestaDB

Sitio web académico de **apuestas deportivas simuladas** — Bases de Datos 2 (Tecnológico de Antioquia).

## Integrantes

- Jhon Bayron Peláez Guerra
- Shantal Coneo García

## Descripción académica

Proyecto académico de la asignatura **Bases de Datos 2** (Tecnológico de Antioquia): los usuarios registran apuestas sobre eventos deportivos ficticios, con saldo y transacciones completamente simuladas.

### Aclaraciones importantes

- **No utiliza dinero real.**
- **No incluye pasarelas de pago reales.**
- **No promueve apuestas reales.**
- Trabaja únicamente con saldo y transacciones ficticias.
- Su prioridad académica es demostrar conocimientos de bases de datos (modelado, normalización, SQL, integridad, transacciones, consultas y reportes).

## Estado actual

- **Fase académica:** Fase 0 — contexto académico (pendiente de validación del profesor).
- **Sandbox técnico autorizado (02/sep/2026):** login/registro reales contra SQL Server con sesión por cookie httpOnly. Pruebas automatizadas PASS. La generación/exportación de Excel fue retirada por decisión de Jhon (no existe conexión Excel↔BD).
- **Stack:** React (Vite) + Node.js (Express) + SQL Server Express local (instancia `SQLEXPRESS01`, base `ApuestaDB`). Pendiente de validación del profesor.
- **Repositorio:** GitHub privado `BayronPG/apuestadb` (rama `main`).
- Los scripts de tablas en `docs/base_datos/` son **material de clase en borrador**, no el modelo definitivo.

---

## 🚀 Cómo iniciar el proyecto

> Comandos para **Windows / PowerShell**, desde la raíz del repositorio (`C:\Proyectos\ApuestaDB`).

### Requisitos previos

1. **Node.js ≥ 18** (probado con Node 24) y npm.
2. **SQL Server Express** local con la instancia `SQLEXPRESS01` (ajusta el nombre si tu instancia es otra).
3. Conexión a la base por **TCP (puerto 1433)** y **modo de autenticación mixto** (SQL + Windows).

### Paso 0 — Configurar SQL Server (solo la primera vez, como Administrador)

El backend de Node.js se conecta por TCP con un login SQL; la instancia debe tener TCP habilitado y modo mixto. Ejecuta **una vez**, en PowerShell como administrador:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "app\backend\scripts\habilitar_tcp_sqlexpress01.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "app\backend\scripts\habilitar_login_mixto.ps1"
```

Cada script verifica su propio resultado (servicio, puerto 1433 y modo de autenticación).

### Paso 1 — Crear la base de datos `ApuestaDB` (solo la primera vez)

Con `sqlcmd` (autenticación de Windows):

```powershell
sqlcmd -S .\SQLEXPRESS01 -E -f 65001 -i "docs\base_datos\script_tablas_sqlserver_borrador.sql"
sqlcmd -S .\SQLEXPRESS01 -E -f 65001 -i "docs\base_datos\script_datos_prueba_borrador.sql"
```

> Si `ApuestaDB` ya existe, el primer script fallará en `CREATE DATABASE`; es normal (ya está creada).
> Estos scripts son el **borrador de clase** (16 tablas + datos ficticios de prueba).

El **modelo actual del proyecto tiene 29 tablas**: a las 16 de clase se suman 13 de la ampliación incorporada al proyecto. Para dejarlas con sus registros de demostración (mínimo 5 por tabla), ejecuta también el script idempotente de ampliación:

```powershell
sqlcmd -S .\SQLEXPRESS01 -E -f 65001 -i "app\backend\scripts\script_ampliacion_sandbox_29_tablas.sql"
```

> Puede ejecutarse varias veces sin duplicar datos. Los scripts originales de clase permanecen intactos.

### Paso 2 — Crear/sincronizar el login SQL de la aplicación

El backend se conecta con el login `apuestadb_app` (la contraseña vive solo en `app/backend/.env`, nunca en el repositorio).

- **Si el login ya existe** (caso de este equipo): sincroniza su contraseña con el `.env` ejecutando:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "app\backend\scripts\sincronizar_clave_login.ps1"
```

- **Si el login no existe** (máquina nueva): créalo una vez y escribe la misma contraseña en `app/backend/.env` (`DB_PASSWORD`):

```sql
-- reemplaza <TU_CLAVE_FUERTE> y ejecuta con sqlcmd -S .\SQLEXPRESS01 -E
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = 'apuestadb_app')
    CREATE LOGIN apuestadb_app WITH PASSWORD = '<TU_CLAVE_FUERTE>', CHECK_POLICY = OFF;
USE ApuestaDB;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'apuestadb_app')
    CREATE USER apuestadb_app FOR LOGIN apuestadb_app;
ALTER ROLE db_owner ADD MEMBER apuestadb_app;
```

### Paso 3 — Configurar variables de entorno del backend

```powershell
cd app\backend
copy .env.example .env    # o:  Copy-Item .env.example .env
```

Edita `.env` con los valores reales (servidor, puerto, base, usuario SQL y secretos). El archivo `.env` **no se versiona** (está en `.gitignore`).

### Paso 4 — Levantar el backend

```powershell
cd app\backend
npm install       # solo la primera vez
npm start         # http://localhost:3000
```

Comprueba la conexión a la base: abre `http://localhost:3000/api/health` → debe responder `{"ok":true,"bd":"ApuestaDB",...}`.

### Paso 5 — Levantar el frontend

```powershell
cd app\frontend
npm install       # solo la primera vez
npm run dev       # http://localhost:5173
```

Abre **http://localhost:5173** en el navegador:

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Inicio de sesión | público |
| `/registrar` | Registro de usuario | público |
| `/recuperar` | Recuperar contraseña (maqueta) | público |
| `/home` | Eventos y saldo | requiere sesión |

El frontend reenvía `/api` al backend mediante el proxy de Vite (no requiere configuración CORS en desarrollo).

### Paso 6 — Probar

Con el backend levantado, ejecuta la batería automatizada (registro, hash, duplicados, login, sesión, logout y roles):

```powershell
cd app\backend
npm run pruebas
```

También puedes probar a mano: registra un usuario nuevo o inicia sesión como `jhon@apuestadb.com` con la clave definida en `PRUEBA_CLAVE_ADMIN` del `.env` (rol `admin`).

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `/api/health` responde pero el login dice "Login failed" | Contraseña del login SQL desincronizada con `.env`, o modo de autenticación solo Windows | Ejecuta `sincronizar_clave_login.ps1` y luego `habilitar_login_mixto.ps1` (admin) |
| El backend no conecta: `Could not connect` | TCP deshabilitado o puerto distinto | `habilitar_tcp_sqlexpress01.ps1` (admin) y revisa `DB_SERVER`/`DB_PORT` en `.env` |
| `EADDRINUSE` al iniciar el backend | Puerto 3000 ocupado por otro proceso | Detén el proceso anterior (`Get-NetTCPConnection -LocalPort 3000 -State Listen`) y vuelve a iniciar |
| El frontend carga pero las llamadas `/api` fallan | Backend apagado o proxy mal configurado | Confirma que el backend corre en `http://localhost:3000` (ver `vite.config.js`) |

## Estructura del workspace

```
ApuestaDB/
├── README.md               ← este archivo
├── PROJECT_CONTEXT.md      ← contexto confirmado, provisional y pendiente
├── DECISION_LOG.md         ← registro de decisiones aprobadas
├── docs/
│   ├── base_datos/         ← scripts SQL de clase (16 tablas, borrador; intactos)
│   ├── mockups/            ← maquetas y capturas
│   ├── pruebas/            ← resumen de pruebas vigente
│   └── ...
├── app/                    ← código de la aplicación (carpeta recomendada para abrir en el editor)
│   ├── README.md
│   ├── backend/            ← API Node.js/Express + scripts de entorno y de ampliación de BD (29 tablas)
│   └── frontend/           ← React + Vite
└── .vscode/                ← configuración y tareas del editor
```

## Abrir el proyecto en un editor

Para trabajar solo con el código de la aplicación (sin la documentación académica del agente), abre la carpeta:

```
C:\Proyectos\ApuestaDB\app
```

- En VS Code / Cursor: **Archivo → Abrir carpeta…** → `C:\Proyectos\ApuestaDB\app`.
- Dentro verás `backend/` y `frontend/` (y `app/README.md` con las instrucciones rápidas).
- `.vscode/` de la raíz aplica al abrir `C:\Proyectos\ApuestaDB`; la carpeta `app` incluye su propia `.vscode` con tareas para levantar backend y frontend.
- Extensiones recomendadas: SQL Server (`ms-mssql.mssql`), PowerShell y Oxlint.
- Tareas integradas: Terminal > Run Task > Backend / Frontend / Pruebas.
- Scripts auxiliares desde la raíz del repositorio (sin dependencias): `npm run dev:backend`, `npm run dev:frontend`, `npm run build:frontend`, `npm run pruebas`.
- `.editorconfig` mantiene codificación UTF-8 y fin de línea consistente en todos los editores.

## Notas de control

- Este proyecto es independiente de `C:\Proyectos\MiControlDiDi`; no comparten archivos.
- El sandbox técnico no representa avance de fase académica ni un modelo definitivo aprobado por el profesor.
- No se hacen `push` ni commits sin autorización explícita de Jhon.
