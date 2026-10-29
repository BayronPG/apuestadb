# ApuestaDB — Backend (API REST)

Backend académico del proyecto **ApuestaDB** (Bases de Datos 2, Tecnológico de Antioquia).
Expone una API REST en Node.js + Express que integra los **14 procedimientos almacenados**,
las **12 vistas** y las **funciones** definidas en `database/` sobre SQL Server.

> Proyecto académico: saldo ficticio, sin dinero real y sin pasarelas de pago.

---

## 1. Requisitos

| Elemento | Versión / nota |
|---|---|
| Node.js | 20 o superior (probado en el entorno del proyecto con Node 24) |
| SQL Server | Instancia local `SQLEXPRESS01` con la base `ApuestaDB` creada |
| Scripts de BD | `database/01..05` + `database/functions`, `views`, `procedures`, `triggers` |

## 2. Instalación y ejecución

```bash
cd backend
npm install                  # instala dependencias del backend
copy .env.example .env       # Windows (o: cp .env.example .env)
# edite .env con los datos reales de su instancia local
npm start                    # http://localhost:4000/api
npm run dev                  # modo desarrollo (reinicio automatico)
```

Comprobación rápida:

```bash
curl http://localhost:4000/api/health
```

## 3. Estructura

```
backend/
  app.js               Pipeline de Express (seguridad, rutas, errores)
  server.js            Arranque HTTP, verificacion de BD, apagado ordenado
  config/
    index.js           Lectura y tipado de variables de entorno
    database.js        Pool mssql + primitivas ejecutar() / consultar()
  repositories/        Acceso a datos (SP y vistas). Sin reglas de negocio
  services/            Reglas de negocio y orquestacion
  controllers/         Traduccion HTTP <-> servicio (sin SQL)
  routes/              Un router por recurso + index.js
  middlewares/         auth, roles, validate, notFound, errorHandler
  utils/               errors, jwt, hash, sqlErrorMapper, asyncHandler
```

Flujo de una petición:

```
HTTP -> routes -> middlewares(auth/roles/validate) -> controller -> service -> repository -> SQL Server
                                                          ^
                                          errorHandler traduce cualquier fallo
```

## 4. Documentación

- `docs/backend/ARQUITECTURA.md` — capas, flujo, decisión bcrypt/login, seguridad.
- `docs/backend/ENDPOINTS.md` — tabla completa de endpoints (23).
- `docs/backend/CONFIGURACION.md` — variables de entorno, pool y ejecución local.

## 5. Formato de respuesta

```json
{ "ok": true,  "data": { } }
{ "ok": false, "error": { "codigo": "SALDO_INSUFICIENTE", "mensaje": "Saldo insuficiente para completar la operacion." } }
```

## 6. Aviso

- No versionar `.env` (contiene credenciales) ni `node_modules/`.
- Las contraseñas se guardan **solo** como hash bcrypt calculado en el backend.
