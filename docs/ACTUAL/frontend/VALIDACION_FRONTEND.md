# VALIDACION_FRONTEND.md — Fase 11 (cierre del frontend React)

**Fecha:** 14/sep/2026
**Alcance:** `frontend/` (React 18 + Vite 5 + react-router-dom 6 + Axios 1)
**Estado:** validación estática y de compilación **aprobada**; ejecución integral contra la API real **pendiente** (ver §6).

---

## 1. Método de validación aplicado

| Tipo | Cómo se verificó | Resultado |
|---|---|---|
| Compilación | `npm run build` (vite build) en `frontend/` | ✅ 143 módulos transformados, 0 errores |
| Rutas | Lectura de `src/routes/AppRoutes.jsx` + `src/routes/rutas.js` | ✅ coherentes |
| Consumo de API | Revisión de los 8 servicios vs. `backend/routes/*` | ✅ sin endpoints inexistentes |
| Sesión (JWT) | `src/services/api.js` + `src/context/AuthContext.jsx` + `utils/almacenamiento.js` | ✅ |
| Guards | `components/ProtectedRoute.jsx`, `components/RoleRoute.jsx` | ✅ |
| Responsive | Media queries en `styles/{global,layout,components}.css` | ✅ 3 breakpoints |
| Ejecución integral (BD + API + UI) | — | ⛔ no ejecutada (§6) |

Artefacto de compilación: `dist/index.html`, `dist/assets/index-*.css` (21.09 kB), `dist/assets/index-*.js` (319.79 kB / 97.90 kB gzip).

---

## 2. Rutas verificadas (15 rutas + índice + 404)

**Públicas (`AuthLayout`):** `/login`, `/registro`, `/recuperar`
**Autenticadas (`ProtectedRoute` + `MainLayout`):** `/` → redirige a `/dashboard`, `/dashboard`, `/eventos`, `/eventos/finalizados`, `/apuestas/nueva`, `/apuestas`, `/saldo`, `/saldo/movimientos`, `/notificaciones`, `/perfil`
**Solo administrador (`RoleRoute rol="administrador"`):** `/admin`, `/admin/reportes`, `/ranking`
**Comodín:** `*` → `NotFound`

Observaciones:
- `/ranking` está bajo rol administrador, igual que `GET /api/reportes/ranking` (`backend/routes/reporte.routes.js`). Coherente.
- Toda ruta interna de la app está declarada en `src/routes/rutas.js`; `Sidebar`, `Navbar` y los enlaces usan ese mapa.
- No hay rutas declaradas sin página ni páginas sin ruta.

---

## 3. Páginas obligatorias de la fase

| # | Pantalla | Ruta | Archivo | Estado |
|---|---|---|---|---|
| 1 | Login | `/login` | `pages/Login.jsx` | ✅ completa |
| 2 | Registro | `/registro` | `pages/Registro.jsx` | ✅ completa |
| 3 | Recuperar contraseña | `/recuperar` | `pages/RecuperarContrasena.jsx` | ✅ completa (solicitud + restablecimiento) |
| 4 | Dashboard Usuario | `/dashboard` | `pages/DashboardUsuario.jsx` | ✅ completa |
| 5 | Dashboard Administrador | `/admin` | `pages/DashboardAdministrador.jsx` | ✅ completa |
| 6 | Eventos Activos | `/eventos` | `pages/EventosActivos.jsx` | ✅ completa |
| 7 | Eventos Finalizados | `/eventos/finalizados` | `pages/EventosFinalizados.jsx` | ✅ completa |
| 8 | Historial de Apuestas | `/apuestas` | `pages/HistorialApuestas.jsx` | ✅ completa |
| 9 | Historial de Movimientos | `/saldo/movimientos` | `pages/HistorialMovimientos.jsx` | ✅ completa |
| 10 | Notificaciones | `/notificaciones` | `pages/Notificaciones.jsx` | ⚠️ completa en lectura; sin "marcar como leída" (falta endpoint, ver `PENDIENTES_BACKEND.md`) |
| 11 | Perfil | `/perfil` | `pages/PerfilUsuario.jsx` | ⚠️ completa en lectura; sin edición (falta endpoint) |
| 12 | Ranking | `/ranking` | `pages/RankingUsuarios.jsx` | ✅ completa (administrador) |
| 13 | Reportes | `/admin/reportes` | `pages/ReportesAdministrativos.jsx` | ✅ completa (administrador) |
| 14 | Crear Apuesta (adicional) | `/apuestas/nueva` | `pages/CrearApuesta.jsx` | ✅ completa (ver §4) |
| 15 | Saldo (apoyo del historial) | `/saldo` | `pages/SaldoUsuario.jsx` | ✅ completa |

Las dos advertencias (10 y 11) están marcadas **en la propia interfaz** con avisos informativos y en `LIMITACIONES_API` (`src/utils/constantes.js`), no se oculta la limitación ni se inventan datos.

---

## 4. Crear Apuesta — verificación de datos necesarios

`POST /api/apuestas` exige `idOpcion`, `idTipoSaldo` y `monto`. Los dos bloqueos históricos (fase 10) quedaron resueltos en la fase 10.1 y la pantalla los consume hoy:

- `idOpcion` → `GET /api/eventos/:id/opciones` (`eventoService.obtenerOpcionesEvento`), que devuelve mercados, opciones, `cuotaVigente` y `premioPotencial` calculado con `monto`.
- `idTipoSaldo` → `GET /api/saldo` (`saldoService.cuentasNormalizadas`), campo `idTipoSaldo` del contrato camelCase.
- Solo se habilita la opción cuando evento `programado`, mercado `abierto` y opción `habilitada` (`ESTADOS_OPERABLES`).

**Conclusión:** no falta ningún endpoint para Crear Apuesta. La pantalla no bloquea al resto del sistema y su fallo (por ejemplo, saldo insuficiente) se muestra como error de formulario sin romper la navegación.

---

## 5. Verificación técnica transversal

| Elemento | Estado | Evidencia |
|---|---|---|
| Context API | ✅ | `context/AuthContext.jsx`: usuario, token, rol, `estaAutenticado`, `esAdministrador`, `login`, `logout`, `error` |
| JWT | ✅ | Token guardado en `localStorage` (`apuestadb.token`), enviado como `Authorization: Bearer` en cada petición |
| Axios | ✅ | Instancia única `services/api.js`: `baseURL = VITE_API_URL || '/api'`, timeout 20 s, `desenvolver()` para la envoltura `{ ok, data }` |
| Interceptor de sesión | ✅ | 401 en ruta privada → limpia sesión y cierra sesión en memoria; 401 en `/auth/*` se muestra como error de credenciales |
| Protected Routes | ✅ | `ProtectedRoute` redirige a `/login` conservando `location.state.desde` |
| Role Routes | ✅ | `RoleRoute` muestra aviso 403 en pantalla (no redirige) y nunca confía en el cliente: el backend vuelve a validar rol en `middlewares/roles.js` |
| Estados visuales | ✅ | Loader, `EmptyState`, `Alert`, estados deshabilitados y mensajes de error en todas las pantallas verificadas |
| Responsive | ✅ | Breakpoints 481 px / 769 px / 1025 px en `global.css`, `layout.css`, `components.css`; `Sidebar` colapsa en ≤1024 px; tablas con contenedor desplazable |

---

## 6. Validación NO realizada (declaración honesta)

- **No se ejecutó la prueba integral** (BD SQL Server + `backend` + `frontend` en navegador). La base local `ApuestaDB` fue eliminada el 14/sep/2026 y el backend no se ha levantado en esta sesión; por lo tanto **no se afirma que las pantallas funcionen en tiempo de ejecución**.
- No se ejecutaron pruebas con los tres perfiles reales (usuario, administrador, sesión vencida) contra la API.
- No se ejecutó revisión de accesibilidad con herramienta externa ni navegador real en móvil; el responsive se verificó por código (media queries y layout fluido).

Para cerrar la fase se requiere: restaurar/crear la base, `npm install` + `npm start` del backend, `npm run dev` del frontend y recorrer el plan de pruebas con los 24 endpoints. Ese recorrido no está autorizado ni solicitado todavía.
