# ApuestaDB — Configuración del backend

Guía de variables de entorno, conexión a SQL Server, pool de conexiones y
ejecución local de la API.

---

## 1. Archivos de entorno

| Archivo | Se versiona | Contenido |
|---|---|---|
| `backend/.env.example` | Sí | Plantilla con **marcadores** `<...>`, sin credenciales reales. |
| `backend/.env` | **No** (ignorado por git) | Valores reales del entorno local. |

Creación en Windows:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

---

## 2. Variables de entorno

### Entorno de ejecución

| Variable | Por defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test`. |
| `PORT` | `4000` | Puerto HTTP de la API. |
| `API_PREFIX` | `/api` | Prefijo de montaje de las rutas. |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes permitidos, separados por coma. `*` permite todos (solo local). |

### Seguridad

| Variable | Por defecto | Descripción |
|---|---|---|
| `JWT_SECRET` | (vacío) | Clave de firma. **Obligatoria, mínimo 32 caracteres.** |
| `JWT_EXPIRES_IN` | `2h` | Vigencia del token (`15m`, `2h`, `7d`, ...). |
| `JWT_ISSUER` | `apuestadb-api` | Emisor (`iss`) que se exige al verificar. |
| `BCRYPT_ROUNDS` | `10` | Rondas de costo de bcrypt (decisión del proyecto: 10). |
| `AUDIT_ACCESS` | `true` | Registra en `Auditoria` los accesos correctos del login. |

### SQL Server

| Variable | Por defecto | Descripción |
|---|---|---|
| `DB_SERVER` | `localhost` | Instancia. Ej.: `localhost\SQLEXPRESS01`. |
| `DB_PORT` | `1433` | Puerto TCP. |
| `DB_NAME` | `ApuestaDB` | Base de datos. |
| `DB_USER` | (vacío) | Usuario SQL (obligatorio con `DB_AUTH_MODE=sql`). |
| `DB_PASSWORD` | (vacío) | Contraseña SQL (obligatoria con `DB_AUTH_MODE=sql`). |
| `DB_AUTH_MODE` | `sql` | `sql` \| `windows`. Ver §6. |
| `DB_ENCRYPT` | `true` | Cifrado de la conexión (`encrypt`). |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | Acepta certificado self-signed local. |
| `DB_POOL_MAX` | `10` | Conexiones máximas del pool. |
| `DB_POOL_MIN` | `0` | Conexiones mínimas del pool. |
| `DB_CONNECT_TIMEOUT` | `15000` | ms para establecer conexión. |
| `DB_REQUEST_TIMEOUT` | `30000` | ms por petición. |

### Registro

| Variable | Por defecto | Descripción |
|---|---|---|
| `LOG_LEVEL` | `info` | Nivel de registro (informativo; el backend usa `console`). |

---

## 3. Configuración del pool (`mssql`)

`config/database.js` construye un único pool perezoso con los valores de `.env`:

```js
{
  server, port, database,
  user, password,                    // modo 'sql'
  connectionTimeout, requestTimeout,
  pool: { max, min, idleTimeoutMillis: 30000 },
  options: { encrypt, trustServerCertificate, enableArithAbort: true, appName: 'ApuestaDB-API' }
}
```

Características:

- **Singleton perezoso**: el pool se crea en la primera petición que necesita
  datos; el arranque de la API no falla si SQL Server no responde.
- **Reutilización**: `obtenerPool()` devuelve el pool conectado; si se está
  conectando, espera esa misma promesa (evita crear pools duplicados en
  concurrencia).
- **Cierre ordenado**: `cerrarPool()` se ejecuta ante `SIGINT`/`SIGTERM`.
- **Dos primitivas**:
  - `ejecutar(nombreSP, entradas, salidas)` → parámetros tipados y OUTPUT.
  - `consultar(textoSQL, parametros)` → `SELECT` parametrizado.

Ejemplo de parámetros tipados:

```js
const { sql, p } = require('../config/database');

await ejecutar('dbo.usp_Apuesta_Registrar', {
  id_usuario: p(sql.Int, 7),
  id_opcion: p(sql.Int, 3),
  id_tipo_saldo: p(sql.Int, 1),
  monto: p(sql.Decimal(18, 2), 50000),
}, { id_apuesta: sql.Int });
```

Tipos usados: `sql.Int`, `sql.BigInt`, `sql.SmallInt`, `sql.Decimal(18,2)`,
`sql.VarChar(n)`, `sql.NVarChar(n)`, `sql.DateTime2`.

---

## 4. Ejecución local

```powershell
cd C:\Proyectos\ApuestaDB\backend
npm install
Copy-Item .env.example .env      # y editar los marcadores
npm start
```

Salida esperada:

```
ApuestaDB API escuchando en http://localhost:4000/api
Entorno: development | Base de datos: ApuestaDB @ localhost\SQLEXPRESS01:1433
[bd] Conexion con SQL Server verificada.
```

Verificación rápida:

```powershell
Invoke-RestMethod http://localhost:4000/api/health | ConvertTo-Json -Depth 5
```

Prueba de login (PowerShell):

```powershell
$cuerpo = @{ correo = 'usuario@ejemplo.com'; contrasena = 'secreta123' } | ConvertTo-Json
$respuesta = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login `
  -ContentType 'application/json' -Body $cuerpo
$respuesta.data.token
```

---

## 5. Orden de preparación de la base de datos

Antes de levantar la API, la base debe estar completa:

```
database/01_database.sql
database/02_tables.sql
database/03_constraints.sql
database/04_indexes.sql
database/05_seed_data.sql
database/functions/01_escalares.sql       (antes de las vistas)
database/functions/02_table_valued.sql
database/views/01_eventos.sql
database/views/02_apuestas.sql
database/views/03_saldo.sql
database/views/04_reportes.sql
database/procedures/01..06                (06_auditoria primero si hay dependencias)
database/triggers/01..05
```

---

## 6. Notas y limitaciones

1. **Autenticación de Windows** (`DB_AUTH_MODE=windows`): el backend marca
   `trustedConnection`, pero el driver por defecto de `mssql` (tedious) no soporta
   autenticación integrada; se requiere el driver opcional `msnodesqlv8`, que **no**
   forma parte del stack obligatorio. Para el entorno local se usa autenticación
   SQL (`DB_AUTH_MODE=sql`). `validarConfiguracion()` emite una advertencia si se
   elige `windows`.
2. **`JWT_SECRET`**: si falta o tiene menos de 32 caracteres, el arranque muestra
   una advertencia. En `production` debe considerarse obligatorio.
3. **Nunca** versionar `.env` ni `.env.*` (excepto `.env.example`); el `.gitignore`
   del backend ya lo cubre.
4. La API **no** ejecuta migraciones ni scripts de base de datos: asume el esquema
   de `database/` ya aplicado.
