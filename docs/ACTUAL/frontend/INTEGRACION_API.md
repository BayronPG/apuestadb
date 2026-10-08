# ApuestaDB — Integracion del frontend con la API

Mapa completo entre pantallas y endpoints, el servicio Axios, el manejo de errores y
las funcionalidades que siguen esperando un endpoint.

**Estado tras la Fase 11.1:** la app consume **24 de 24 endpoints** de la API y no
queda ninguna pantalla usando datos simulados.

---

## 1. Servicio Axios (`src/services/api.js`)

```js
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});
```

| Elemento | Comportamiento |
|---|---|
| `baseURL` | `VITE_API_URL` (`.env`); por defecto `/api`, redirigido por el proxy de Vite a `http://localhost:4000` |
| Interceptor REQUEST | Lee el token de `localStorage` (`apuestadb.token`) y agrega `Authorization: Bearer <token>` |
| Interceptor RESPONSE | Ante **401** en rutas protegidas: borra la sesion, notifica al `AuthContext` y redirige a `/login` |
| Rutas publicas excluidas | `/auth/login`, `/auth/registro`, `/auth/recuperar`, `/auth/restablecer` (asi el 401 de credenciales se muestra en el formulario) |
| `desenvolver(respuesta)` | Desempaqueta la envoltura `{ ok: true, data }` y lanza error si `ok !== true` |

### Servicios por agregado

| Archivo | Endpoints |
|---|---|
| `authService.js` | `/auth/registro`, `/auth/login`, `/auth/recuperar`, `/auth/restablecer` |
| `saldoService.js` | `/saldo`, `/saldo/movimientos` (+ `normalizarCuenta` y `cuentasNormalizadas`) |
| `apuestaService.js` | `/apuestas` (POST y GET con `estado`), `/apuestas/pendientes`, `/ganadas`, `/perdidas` |
| `eventoService.js` | `/eventos/activos`, `/eventos/finalizados`, **`/eventos/:id/opciones`**, `/eventos/:id/resultado` |
| `notificacionService.js` | `/notificaciones` |
| `reporteService.js` | `/reportes/administrativo`, `/reportes/financiero`, `/reportes/ranking` |
| `adminService.js` | `/recargas`, `/liquidaciones`, `/usuarios`, `/auditoria` |
| `sistemaService.js` | `/health` |

---

## 2. Formatos de datos (verificados en el backend)

La API **no es homogenea** en el nombre de las columnas. Se confirmo en
`backend/services/*.js`, `backend/repositories/*.js` y
`docs/ACTUAL/backend/INTEGRACION_FRONTEND.md`:

| Endpoint | Envoltura | Filas | Forma |
|---|---|---|---|
| `GET /api/eventos/:id/opciones` | `{ evento, mercados }` | `evento`, `mercados[].opciones[]` | **camelCase** (`idMercado`, `cuotaVigente`, `fechaCierre`, `premioPotencial`) |
| `GET /api/saldo` | `{ cuentas, saldoTotal }` | `cuentas[]` | **ambas**: conserva `id_saldo_cuenta`, `tipo_saldo`, `saldo_actual`, `fecha_ultima_actualizacion` y **añade** `idSaldoCuenta`, `idTipoSaldo`, `nombreTipoSaldo`, `saldoActual`, `fechaUltimaActualizacion` |
| `GET /api/saldo/movimientos` | `{ movimientos, total }` | `movimientos[]` | **snake_case** |
| `GET /api/apuestas*` (5 rutas) | `{ apuestas, total }` | `apuestas[]` | **snake_case** |
| `GET /api/eventos/activos` · `/finalizados` | `{ eventos, total }` | `eventos[]` | **snake_case** |
| `GET /api/notificaciones` | `{ notificaciones, total }` | `notificaciones[]` | **snake_case** |
| `GET /api/reportes/*` (3 rutas) | `{ filas, total }` | `filas[]` | **snake_case** (columnas de las vistas) |
| `GET /api/auditoria` | `{ registros, total }` | `registros[]` | **snake_case** |
| `GET /api/usuarios` | `{ usuarios, total }` | `usuarios[]` | **snake_case** |
| `GET /api/health` | objeto plano | — | **camelCase** (`uptimeSegundos`, `baseDatos`) |
| `POST /api/auth/login` | `{ token, expiraEn, usuario }` | `usuario` | **camelCase** (`idUsuario`, `nombres`, `rol`) |
| Escrituras (`POST /auth/registro`, `/apuestas`, `/recargas`, `/liquidaciones`, `/eventos/:id/resultado`, `/auth/recuperar|restablecer`) | objeto plano | — | **camelCase** (`idApuesta`, `idRecarga`, `apuestasLiquidadas`, `idResultado`, `valorToken`) |

**Inconsistencia detectada y reportada (no inventada):** los endpoints de la Fase
10.1 (`/eventos/:id/opciones` y los campos nuevos de `/saldo`) usan camelCase
porque se mapean en la capa `services/` del backend, mientras que las vistas y
procedimientos previos devuelven `snake_case` directamente desde SQL Server. En
`/saldo` conviven ambas formas de manera **deliberada y temporal** (documentado en
`docs/ACTUAL/backend/INTEGRACION_FRONTEND.md §5.4`). El frontend usa camelCase donde existe
y snake_case en el resto; `saldoService.normalizarCuenta()` resuelve las dos formas
de `/saldo` sin fabricar valores (`idTipoSaldo` queda `null` si no viene).

---

## 3. Pantalla ↔ endpoint

| Pantalla (ruta) | Endpoint | Cuerpo / query | Datos que usa |
|---|---|---|---|
| Login `/login` | `POST /api/auth/login` | `{ correo, contrasena }` | `token`, `expiraEn`, `usuario{...}` |
| Registro `/registro` | `POST /api/auth/registro` | `{ nombres, apellidos, correo, contrasena, telefono? }` | `idUsuario`, `mensaje` |
| Recuperar `/recuperar` (1) | `POST /api/auth/recuperar` | `{ correo }` | `valorToken`, `mensaje` |
| Recuperar `/recuperar` (2) | `POST /api/auth/restablecer` | `{ correo, valorToken, nuevaContrasena }` | `mensaje` |
| Dashboard `/dashboard` | `GET /api/saldo` | — | `cuentas[]` (camelCase), `saldoTotal` |
| Dashboard `/dashboard` | `GET /api/apuestas` | — | 5 apuestas recientes |
| Dashboard `/dashboard` | `GET /api/eventos/activos` | — | 3 eventos proximos |
| Dashboard `/dashboard` | `GET /api/saldo/movimientos` | — | 5 movimientos recientes |
| Eventos activos `/eventos` | `GET /api/eventos/activos` | — | cartelera |
| Eventos activos `/eventos` | `GET /api/eventos/:id/opciones` | — | cuotas al desplegar un evento |
| Eventos finalizados `/eventos/finalizados` | `GET /api/eventos/finalizados` | — | resultados y `opcion_ganadora` |
| **Crear apuesta `/apuestas/nueva`** | `GET /api/eventos/activos` | — | selector de evento |
| **Crear apuesta `/apuestas/nueva`** | **`GET /api/eventos/:id/opciones`** | — | mercados, opciones, `idOpcion`, `cuotaVigente`, `estado` |
| **Crear apuesta `/apuestas/nueva`** | **`GET /api/eventos/:id/opciones?monto=`** | `monto > 0` | `premioPotencial` recalculado por la API (debounce 500 ms) |
| **Crear apuesta `/apuestas/nueva`** | **`GET /api/saldo`** | — | `idTipoSaldo`, `nombreTipoSaldo`, `saldoActual` (selector de saldo) |
| **Crear apuesta `/apuestas/nueva`** | **`POST /api/apuestas`** | `{ idOpcion, idTipoSaldo, monto }` | `201 { idApuesta, mensaje }` |
| Historial `/apuestas` | `GET /api/apuestas?estado=` | `estado` por pestana | lista + `total` |
| Historial `/apuestas` | `GET /api/apuestas/{pendientes,ganadas,perdidas}` | — | resumen (totales, montos, premios) |
| Saldo `/saldo` | `GET /api/saldo` | — | `idSaldoCuenta`, `idTipoSaldo`, `nombreTipoSaldo`, `saldoActual` |
| Movimientos `/saldo/movimientos` | `GET /api/saldo/movimientos` | `idTipoSaldo`, `desde`, `hasta` | movimientos + filtro por tipo |
| Movimientos `/saldo/movimientos` | `GET /api/saldo` | — | ids y nombres de los tipos para el filtro |
| Notificaciones `/notificaciones` | `GET /api/notificaciones` | `estado?`, `limite=100` | bandeja |
| Perfil `/perfil` | `GET /api/saldo` | — | cuentas; los datos personales vienen de la sesion |
| Admin `/admin` | `GET /api/usuarios` | `limite=200` | tabla de usuarios con saldo consolidado |
| Admin `/admin` | `GET /api/eventos/activos` | — | selector de evento para el resultado |
| Admin `/admin` | `GET /api/eventos/finalizados` | — | selector de evento para liquidar |
| Admin `/admin` | **`POST /api/eventos/:id/resultado`** | `{ marcadorLocal, marcadorVisitante, estado }` | `idResultado`, `mensaje` |
| Admin `/admin` | **`POST /api/liquidaciones`** | `{ idEvento }` o `{ idApuesta }` | `apuestasLiquidadas`, `mensaje` |
| Admin `/admin` | **`POST /api/recargas`** | `{ idUsuario, idTipoSaldo, monto, observacion? }` | `201 { idRecarga, mensaje }` |
| Admin `/admin` | `GET /api/saldo` | — | tipos de saldo (`idTipoSaldo`, `nombreTipoSaldo`) del selector de recarga |
| Admin `/admin` | `GET /api/reportes/administrativo` | — | metricas agregadas |
| Admin `/admin` | `GET /api/reportes/financiero` | — | `saldo_en_cuentas` |
| Ranking `/ranking` | `GET /api/reportes/ranking` | — | `filas[]` |
| Reportes `/admin/reportes` | `GET /api/reportes/{administrativo,financiero,ranking}` | — | `filas[]` |
| Reportes `/admin/reportes` | `GET /api/auditoria` | `operacion?`, `top?` | `registros[]` |
| Reportes `/admin/reportes` | `GET /api/usuarios` | `estado?`, `rol?`, `limite=200` | `usuarios[]` |
| Navbar (`MainLayout`) | `GET /api/saldo` | — | `saldoTotal` |
| Footer (todas) | `GET /api/health` | — | `version`, `entorno`, `baseDatos.estado` |

**Cobertura: 24 de 24 endpoints ejecutados desde la interfaz.**

---

## 4. Manejo de errores

1. **Normalizacion** (`utils/errores.js`): todo fallo se convierte en
   `{ codigo, mensaje, detalles, estado }`.
   - Error de la API: usa `error.mensaje` (y `error.detalles` si existe).
   - Sin respuesta del servidor: "No se pudo contactar la API (http://localhost:4000)...".
   - Tiempo agotado: `TIEMPO_AGOTADO`.
2. **Sesion vencida:** el interceptor de 401 limpia `localStorage`, el `AuthContext`
   borra `usuario`/`token` y `ProtectedRoute` redirige a `/login`.
3. **Errores de credenciales:** en `/auth/login` el 401 no redirige; el mensaje se
   muestra en el `<Alert>` del formulario.
4. **Errores de negocio de la apuesta** (`CrearApuesta`): se muestra el codigo y el
   mensaje que devuelve el backend, por ejemplo `MERCADO_CERRADO` (409),
   `EVENTO_INICIADO` (409), `SALDO_INSUFICIENTE` (409), `OPCION_NO_HABILITADA` (400),
   `CUENTA_NO_ENCONTRADA` (404).
5. **Errores de la recarga**: `USUARIO_INACTIVO`, `TIPO_SALDO_INVALIDO`,
   `CUENTA_SALDO_NO_ENCONTRADA` (404) y `MONTO_INVALIDO` se muestran en el modal.
6. **Errores de validacion del cliente:** `utils/validaciones.js` replica los limites
   del backend (correo <= 150, contrasena 8-72, telefono <= 20, monto > 0) y evita
   viajes innecesarios a la API.
7. **`GET /api/health` siempre responde 200:** el estado real de la base se lee en
   `data.baseDatos.estado` y se pinta como badge en el footer.

---

## 5. Reconciliacion de nombres (Fase 11.1)

| Propuesta anterior (Fase 11) | Real implementado (Fase 10.1) | Estado |
|---|---|---|
| `GET /api/eventos/:id/mercados` | **`GET /api/eventos/:id/opciones`** | Resuelto: el catalogo llega con evento + mercados + opciones + cuotas |
| `GET /api/saldo/tipos` (catalogo de tipos) | **`idTipoSaldo` + `nombreTipoSaldo` dentro de `GET /api/saldo`** | Resuelto para apostar y para recargar desde la sesion del administrador |
| Endpoint para marcar notificacion como leida | **no existe** | Pendiente (no bloqueante) |
| Endpoint de perfil (`GET/PUT`) | **no existe** | Pendiente (no bloqueante) |

Ninguna ruta propuesta en la Fase 11 se implemento con otro nombre sin documentarlo;
el frontend **no** contiene ninguna llamada a una ruta que no exista.

---

## 6. Limitaciones pendientes (todas no bloqueantes)

| # | Necesidad | Uso actual | Endpoint sugerido |
|---|---|---|---|
| 1 | Marcar notificacion como leida | `/notificaciones` es de solo lectura (la API solo expone `GET`) | `PATCH /api/notificaciones/:id` |
| 2 | Consultar/actualizar perfil | `/perfil` muestra los datos de la respuesta del login | `GET/PUT /api/usuarios/perfil` |
| 3 | Catalogo global de tipos de saldo | La recarga en `/admin` toma los tipos de las cuentas del **administrador** (`GET /api/saldo`). Los ids son globales (`dbo.TipoSaldo`), por lo que sirven para recargar a cualquier usuario, pero si el administrador no tuviera cuenta de un tipo, ese tipo no apareceria en el selector | `GET /api/saldo/tipos` |

Las tres estan declaradas en `frontend/src/utils/constantes.js` (`LIMITACIONES_API`) y
en la interfaz se informan con `<Alert tipo="info">`, sin simular datos.

---

## 7. Reglas respetadas al integrar

1. **No se inventaron endpoints ni datos.** Cada llamada corresponde a una ruta de
   `backend/routes/*.js`; las cuotas, el premio potencial y los saldos provienen de
   la API.
2. **No se envian identificadores de usuario.** `id_usuario` y `id_administrador`
   salen del token en el backend.
3. **Se respetan los nombres de campo exactos** de cuerpos, queries y filas, en la
   forma real de cada endpoint (§2).
4. **Los formularios replican las validaciones del backend** antes de enviar.
5. **El premio potencial que se muestra es el que calcula la API** (`?monto=`), con la
   misma formula que `dbo.fn_PremioPotencial`; el valor definitivo se fija al liquidar
   con la cuota congelada.
