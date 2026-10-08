# ApuestaDB — Rutas del frontend

Arbol de rutas de la SPA (`frontend/src/routes/AppRoutes.jsx`), con la pagina, el rol
requerido y los endpoints que consume cada pantalla (actualizado en la **Fase 11.1**).

---

## 1. Resumen por rol

| Rol | Rutas |
|---|---|
| Publico (sin sesion) | `/login`, `/registro`, `/recuperar` |
| `usuario` (cualquier sesion valida) | `/dashboard`, `/eventos`, `/eventos/finalizados`, `/apuestas/nueva`, `/apuestas`, `/saldo`, `/saldo/movimientos`, `/notificaciones`, `/perfil` |
| `administrador` | Las anteriores + `/admin`, `/admin/reportes`, `/ranking` |
| Cualquiera | `*` → 404 |

Los grupos se implementan con `ProtectedRoute` (sesion) y `RoleRoute rol="administrador"`.
El backend valida lo mismo con `middlewares/auth.js` y `middlewares/roles.js`: ocultar
la pantalla no sustituye la autorizacion del servidor.

---

## 2. Tabla detallada

| # | Ruta | Pagina (`src/pages/`) | Rol | Endpoint(s) |
|---|---|---|---|---|
| 1 | `/login` | `Login.jsx` | — | `POST /api/auth/login` |
| 2 | `/registro` | `Registro.jsx` | — | `POST /api/auth/registro` |
| 3 | `/recuperar` | `RecuperarContrasena.jsx` | — | `POST /api/auth/recuperar`, `POST /api/auth/restablecer` |
| 4 | `/dashboard` | `DashboardUsuario.jsx` | sesion | `GET /api/saldo`, `GET /api/apuestas`, `GET /api/eventos/activos`, `GET /api/saldo/movimientos` |
| 5 | `/admin` | `DashboardAdministrador.jsx` | admin | `GET /api/usuarios`, `GET /api/eventos/activos`, `GET /api/eventos/finalizados`, `GET /api/saldo`, `GET /api/reportes/administrativo`, `GET /api/reportes/financiero`, `POST /api/eventos/:id/resultado`, `POST /api/liquidaciones`, `POST /api/recargas` |
| 6 | `/eventos` | `EventosActivos.jsx` | sesion | `GET /api/eventos/activos`, `GET /api/eventos/:id/opciones` |
| 7 | `/eventos/finalizados` | `EventosFinalizados.jsx` | sesion | `GET /api/eventos/finalizados` |
| 8 | `/apuestas/nueva` | `CrearApuesta.jsx` | sesion | `GET /api/eventos/activos`, `GET /api/eventos/:id/opciones` (+ `?monto=`), `GET /api/saldo`, `POST /api/apuestas` |
| 9 | `/apuestas` | `HistorialApuestas.jsx` | sesion | `GET /api/apuestas?estado=`, `GET /api/apuestas/pendientes`, `GET /api/apuestas/ganadas`, `GET /api/apuestas/perdidas` |
| 10 | `/saldo` | `SaldoUsuario.jsx` | sesion | `GET /api/saldo` |
| 11 | `/saldo/movimientos` | `HistorialMovimientos.jsx` | sesion | `GET /api/saldo/movimientos?idTipoSaldo=&desde=&hasta=`, `GET /api/saldo` (tipos para el filtro) |
| 12 | `/notificaciones` | `Notificaciones.jsx` | sesion | `GET /api/notificaciones?estado=&limite=` |
| 13 | `/perfil` | `PerfilUsuario.jsx` | sesion | `GET /api/saldo` (los datos personales vienen de la sesion) |
| 14 | `/ranking` | `RankingUsuarios.jsx` | admin | `GET /api/reportes/ranking` |
| 15 | `/admin/reportes` | `ReportesAdministrativos.jsx` | admin | `GET /api/reportes/administrativo`, `/financiero`, `/ranking`, `GET /api/auditoria`, `GET /api/usuarios` |
| 16 | `*` | `NotFound.jsx` | — | — |
| — | `/` (indice) | Redirige a `/dashboard` | sesion | — |

Ademas, `MainLayout` (envoltura de todas las rutas con sesion) usa `GET /api/saldo`
para el chip del navbar y `Footer` usa `GET /api/health` en todas las pantallas
autenticadas.

---

## 3. Cobertura de la API (24 endpoints)

| Grupo | Endpoints | Consumidos por el frontend |
|---|---|---|
| Autenticacion (4) | registro, login, recuperar, restablecer | 4 / 4 |
| Saldo (2) | saldo (modificado en Fase 10.1), movimientos | 2 / 2 |
| Recargas (1) | `POST /api/recargas` | 1 / 1 (desbloqueado en Fase 11.1) |
| Apuestas (5) | registrar + 4 consultas | 5 / 5 (registrar desbloqueado en Fase 11.1) |
| Eventos (4) | activos, finalizados, **`/eventos/:id/opciones`**, resultado | 4 / 4 |
| Liquidaciones (1) | `POST /api/liquidaciones` | 1 / 1 |
| Notificaciones (1) | `GET /api/notificaciones` | 1 / 1 |
| Reportes (3) | administrativo, financiero, ranking | 3 / 3 |
| Auditoria (1) | `GET /api/auditoria` | 1 / 1 |
| Usuarios (1) | `GET /api/usuarios` | 1 / 1 |
| Sistema (1) | `GET /api/health` | 1 / 1 |
| **Total** | **24** | **24 / 24** |

---

## 4. Rutas con funcionalidad pendiente

| Ruta | Motivo | Comportamiento actual |
|---|---|---|
| `/notificaciones` | No existe endpoint para marcar como leida | Bandeja de solo lectura con filtro por `estado`; se informa con un `Alert` |
| `/perfil` | No existe endpoint de consulta/actualizacion de perfil | Muestra los datos de la sesion (respuesta del login) y lo advierte |
| `/admin` (recarga) | No existe catalogo global de tipos de saldo | El selector se construye con los tipos de `GET /api/saldo` del administrador (ids globales de `dbo.TipoSaldo`); si faltara un tipo, se informa y el boton se deshabilita |

---

## 5. Navegacion

- Redireccion automatica tras iniciar sesion: `administrador` → `/admin`,
  `usuario` → `/dashboard`. Si el usuario llego desde una ruta protegida, se respeta
  `location.state.desde`.
- `/eventos` enlaza a `/apuestas/nueva?evento=<id>` y `CrearApuesta` preselecciona ese
  evento (parametro `evento` de la URL).
- `NotFound` ofrece el camino de regreso segun haya sesion o no.
- El sidebar marca el enlace activo con `NavLink` (`end` en las rutas raiz de grupo
  para no resaltar subrutas).
