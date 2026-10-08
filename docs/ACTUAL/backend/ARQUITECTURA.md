# ApuestaDB — Arquitectura del backend

Documento de referencia de la API REST (`backend/`). Fase 10 del proyecto.

---

## 1. Visión general

La API es una aplicación **Node.js + Express** en JavaScript CommonJS que expone
23 endpoints bajo el prefijo `/api`. Toda la persistencia se resuelve contra
**SQL Server** (base `ApuestaDB`) a través del driver `mssql`, invocando los
procedimientos almacenados y las vistas creados en `database/`.

La lógica sensible del negocio (cuota congelada, saldo suficiente, mercado
abierto, derivación de la opción ganadora, atomicidad de saldo + movimiento)
**vive dentro de la base de datos**. El backend no la reimplementa: la invoca y
traduce sus errores a HTTP.

---

## 2. Capas

```
Petición HTTP
   |
   v
routes/          Define la ruta, los middlewares y la cadena de validación.
   |
   v
middlewares/     auth (JWT), roles (usuario/administrador), validate (express-validator).
   |
   v
controllers/     Lee req (body, query, params, req.usuario), llama al servicio y
   |             responde con { ok, data }. NO contiene SQL ni reglas de negocio.
   v
services/        Reglas de negocio y orquestación (p. ej. login bcrypt, auditoría,
   |             cálculo del saldo total). Decide qué repositorio invocar.
   v
repositories/    Acceso a datos: un archivo por agregado. Solo SP y consultas
   |             parametrizadas sobre vistas/tablas.
   v
config/database  Pool mssql + primitivas ejecutar() / consultar().
   v
SQL Server (ApuestaDB): procedimientos usp_*, vistas vw_*, funciones fn_*
```

Regla de dependencia: `routes -> controllers -> services -> repositories -> config/database`.
Ninguna capa invoca hacia arriba.

### Repositorios por agregado

| Repositorio | Responsabilidad | Objetos de BD usados |
|---|---|---|
| `usuario.repository.js` | Registro, credenciales, listado, recuperación de clave | `usp_Usuario_Registrar`, `usp_Auth_RecuperarContrasena`, `Usuario`, `Rol`, `vw_SaldoConsolidado` |
| `saldo.repository.js` | Saldos, movimientos y recargas | `usp_Saldo_Consultar`, `usp_MovimientoSaldo_Historial`, `usp_MovimientoSaldo_Registrar`, `usp_Recarga_Crear` |
| `apuesta.repository.js` | Registro, liquidación e historial de apuestas | `usp_Apuesta_Registrar`, `usp_Apuesta_Liquidar`, `usp_Apuesta_Historial`, `vw_ApuestasPendientes/Ganadas/Perdidas` |
| `evento.repository.js` | Cartelera y resultados | `vw_EventosActivos`, `vw_EventosFinalizados`, `usp_Evento_RegistrarResultado` |
| `auditoria.repository.js` | Trazas de auditoría | `usp_Auditoria_Registrar`, `usp_Auditoria_Consultar` |
| `reporte.repository.js` | Reportes administrativos | `vw_ReporteAdministrativo`, `vw_ReporteFinanciero`, `vw_RankingUsuarios` |
| `notificacion.repository.js` | Lectura de notificaciones del usuario | `Notificacion` (consulta parametrizada) |

> Se agregó `notificacion.repository.js` a los seis agregados indicados porque el
> recurso `/api/notificaciones` necesita una lectura que el modelo no cubre: no
> existe vista ni procedimiento de consulta de notificaciones (solo
> `usp_Notificacion_Crear`, de escritura).

---

## 3. Flujo de una petición (ejemplo real)

`POST /api/apuestas` con cuerpo `{ "idOpcion": 3, "idTipoSaldo": 1, "monto": 50000 }`
y encabezado `Authorization: Bearer <token>`:

1. **`routes/apuesta.routes.js`** — la ruta existe y encadena `autenticar`,
   las validaciones de `express-validator`, `validar` y el controlador.
2. **`middlewares/auth.js`** — extrae el token, verifica firma/emisor/vigencia y
   deja `req.usuario = { id, rol }`. Si falla → 401.
3. **`middlewares/validate.js`** — si hay errores de formato → 400 con `detalles`.
4. **`controllers/apuesta.controller.js`** — toma `idUsuario` **del token** (nunca
   del cuerpo) y llama al servicio.
5. **`services/apuesta.service.js`** — normaliza y delega en el repositorio.
6. **`repositories/apuesta.repository.js`** — ejecuta
   `dbo.usp_Apuesta_Registrar @id_usuario, @id_opcion, @id_tipo_saldo, @monto, @id_apuesta OUTPUT`.
7. **`config/database.js`** — toma una conexión del pool, registra los parámetros
   tipados (`sql.Int`, `sql.Decimal(18,2)`) y ejecuta el procedimiento.
8. El SP valida mercado/evento/saldo dentro de una transacción, inserta la apuesta
   y descuenta el saldo. Si algo falla, lanza `THROW 500xx`.
9. **Respuesta** — 201 `{ ok: true, data: { idApuesta, mensaje } }`.
   Ante un `THROW`, `middlewares/errorHandler.js` mapea el número de error a
   `{ ok: false, error: { codigo, mensaje } }` con el estado HTTP correcto.

### Detalle relevante: procedimientos que invocan a otros

`usp_Apuesta_Registrar`, `usp_Recarga_Crear` y `usp_Apuesta_Liquidar` invocan
procedimientos internos que también emiten `SELECT` (`usp_MovimientoSaldo_Registrar`,
`usp_Notificacion_Crear`). Por eso `config/database.js` expone `registros` como el
**último** conjunto de resultados (`ultimoRecordset`), que es donde el
procedimiento externo devuelve su resultado final.

---

## 4. Decisión de diseño: bcrypt y el inicio de sesión

**Contexto.** `dbo.usp_Auth_IniciarSesion` compara la credencial por **igualdad**:

```sql
IF @hash <> @contrasena_hash  THROW 50013, N'Credenciales invalidas.', 1;
```

bcrypt genera una **sal aleatoria por hash**, por lo que el mismo texto plano
produce hashes distintos en cada cálculo. Enviar el hash recalculado y compararlo
por igualdad **siempre fallaría**. El propio procedimiento lo documenta:

> *"la comparacion es por igualdad de hash. Si el backend usa un hash con sal
> aleatoria (bcrypt), la verificacion se hace en el backend y este procedimiento
> se usa para obtener la credencial y auditar."* — `database/procedures/01_auth.sql`

**Decisión adoptada (no se modificó ningún procedimiento).** `POST /api/auth/login`
ejecuta en el backend:

1. Lee la credencial con una consulta **parametrizada**:
   `SELECT id_usuario, nombres, apellidos, correo, telefono, contrasena, estado, id_rol, r.nombre AS nombre_rol FROM dbo.Usuario u JOIN dbo.Rol r ... WHERE u.correo = @correo`.
2. Valida el estado: si no es `activo` → 403 `USUARIO_INHABILITADO`.
3. Verifica con `bcrypt.compare(contrasena, credencial.contrasena)`.
4. Registra el intento invocando `dbo.usp_Auditoria_Registrar` con resultado
   `'exito'` o `'fallo'` y la dirección de origen (`req.ip`).
5. Emite el JWT con `{ sub: id_usuario, rol }`.

Consecuencias:

- El procedimiento `usp_Auth_IniciarSesion` **no se invoca** en el login: queda
  disponible para escenarios donde el hash sea determinista (no bcrypt).
- La auditoría de accesos se preserva íntegra (éxito y fallo), igual que haría el SP.
- El hash jamás sale de la capa de repositorio y la contraseña plana solo existe
  en memoria durante la comparación.
- Si `usp_Auditoria_Registrar` falla, el login **no** se cae: `auditoria.service.js`
  registra la advertencia y continúa (la auditoría es un efecto secundario).

**Registro y recuperación** sí usan los procedimientos tal cual, enviando el hash
calculado con `bcrypt.hash(contrasena, 10)`:

- `usp_Usuario_Registrar @contrasena_hash` (registro).
- `usp_Auth_RecuperarContrasena` con `@accion='restablecer'` y `@nueva_contrasena_hash`.

**Decisión derivada.** `POST /api/auth/recuperar` devuelve el token generado en la
respuesta para poder completar el flujo académico sin servidor de correo. En un
entorno real el token solo se enviaría por correo; este supuesto está declarado en
`ENDPOINTS.md`.

---

## 5. Seguridad

| Control | Implementación |
|---|---|
| Hash de contraseñas | `bcrypt.hash(pass, 10)` en `utils/hash.js` (rondas configurables con `BCRYPT_ROUNDS`). |
| Verificación de contraseñas | `bcrypt.compare` en el servicio de autenticación. |
| Sesión | JWT firmado (`HS256`) con `{ sub, rol }`, `iss` configurable y expiración `JWT_EXPIRES_IN`. |
| Autorización | `middlewares/auth.js` (token) + `middlewares/roles.js` (`roles('administrador')`). |
| Inyección SQL | 100 % de las consultas usan parámetros (`request.input`) o procedimientos almacenados. No hay concatenación de valores. |
| Validación de entrada | `express-validator` en todos los cuerpos y en el parámetro `:id` de resultados. |
| Cabeceras HTTP | `helmet()` con valores por defecto. |
| CORS | Lista blanca de orígenes en `CORS_ORIGIN` (el frontend React). `*` solo en local. |
| Identidad del actor | `id_usuario` y `id_administrador` salen **siempre** del token, nunca del cuerpo ni de la URL. |
| Fuga de información | El manejador de errores envía solo `{ codigo, mensaje }`; las trazas y los mensajes de SQL Server quedan en consola. Las contraseñas no se registran ni se auditan. |
| Límite de cuerpo | `express.json({ limit: '100kb' })`. |
| Caché | `Cache-Control: no-store` en todas las respuestas. |
| Secretos | `.env` ignorado por git; `.env.example` solo contiene marcadores. |

---

## 6. Errores y mapeo de códigos

Los procedimientos señalizan reglas de negocio con `THROW 50001..50224`. El número
llega en `error.number` y `utils/sqlErrorMapper.js` lo traduce a
`{ estado HTTP, codigo funcional, mensaje }` según este criterio:

| Rango | Origen | Estado HTTP típico |
|---|---|---|
| 50001–50008 | `usp_Usuario_Registrar` | 400 (40008 → 409 duplicados) |
| 50010–50013 | `usp_Auth_IniciarSesion` | 401 / 403 |
| 50020–50024 | `usp_Auth_RecuperarContrasena` | 400 / 404 |
| 50030 | `usp_Saldo_Consultar` | 404 |
| 50040–50044 | `usp_MovimientoSaldo_Registrar` | 400 / 404 / 409 (saldo insuficiente) |
| 50050–50054 | `usp_Recarga_Crear` | 400 / 403 / 404 |
| 50060–50069 | `usp_Apuesta_Registrar` | 400 / 404 / 409 |
| 50070–50075 | `usp_Apuesta_Liquidar` | 400 / 404 / 409 |
| 50080–50084 | `usp_Evento_RegistrarResultado` | 400 / 404 / 409 |
| 50090–50092 | `usp_Notificacion_Crear` | 400 / 404 |
| 50100–50113 | Historiales y auditoría | 400 / 404 |
| 50200–50224 | Triggers de integridad | 409 |

También se mapean errores nativos de SQL Server (2627/2601 duplicado → 409,
547 integridad → 409, 208 objeto inexistente → 503, 4060 base inaccesible → 503,
18456 autenticación → 503) y errores de red del driver
(`ETIMEOUT` → 504, `ECONNREFUSED`/`ESOCKET` → 503).

Todo error termina en `middlewares/errorHandler.js` con el formato uniforme:

```json
{ "ok": false, "error": { "codigo": "MERCADO_CERRADO", "mensaje": "El mercado ya cerro." } }
```

---

## 7. Decisiones y supuestos declarados

1. **Login propio (bcrypt)** en lugar de `usp_Auth_IniciarSesion` — ver §4.
2. **`notificacion.repository.js`** añadido para la lectura de notificaciones.
3. **`utils/asyncHandler.js`** añadido además de los cuatro utilitarios previstos,
   para no repetir `try/catch` en cada controlador.
4. **`GET /api/eventos/*` requiere sesión** (cualquier rol): la cartelera es para
   usuarios autenticados; el registro de resultados es solo de administrador.
5. **`GET /api/saldo/movimientos`** delega los filtros `idTipoSaldo`, `desde` y
   `hasta` a `usp_MovimientoSaldo_Historial`; el `id_usuario` siempre es el del token.
6. **`GET /api/usuarios`** no tiene procedimiento de listado en el modelo: usa una
   consulta parametrizada sobre `Usuario` + `Rol` + `vw_SaldoConsolidado`.
7. **`GET /api/health` responde 200** aunque la base no esté disponible; el estado
   real viaja en `data.baseDatos.estado` (`conectada` | `sin_respuesta` | `no_disponible`).
8. **Autenticación integrada de Windows**: se contempla con `DB_AUTH_MODE=windows`,
   pero el driver por defecto de `mssql` (tedious) no la soporta; requeriría
   `msnodesqlv8`, que no forma parte del stack obligatorio. El camino soportado es
   autenticación SQL.
