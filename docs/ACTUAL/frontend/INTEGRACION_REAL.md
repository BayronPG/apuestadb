# INTEGRACION_REAL.md — Frontend ↔ API real (Fase 11)

**Fecha:** 14/sep/2026
**Regla aplicada:** cada llamada del frontend sale de `frontend/src/services/*.js` y apunta a una ruta declarada en `backend/routes/*.js`. Ninguna pantalla usa `axios` directamente ni consume endpoints inexistentes.

Base URL: `VITE_API_URL` o `/api` (proxy de Vite → `http://localhost:4000`).
Respuesta uniforme del backend: `{ ok: true, data: ... }` — se desempaqueta con `desenvolver()` (`services/api.js`).

---

## 1. Mapa pantalla → servicio → endpoint → backend

| Pantalla | Servicio / función | Endpoint real | Archivo backend |
|---|---|---|---|
| Login | `authService.iniciarSesion` | `POST /api/auth/login` | `routes/auth.routes.js` → `auth.controller` |
| Registro | `authService.registrarUsuario` | `POST /api/auth/registro` | idem |
| Recuperar contraseña | `authService.solicitarRecuperacion` | `POST /api/auth/recuperar` | idem |
| Recuperar contraseña (paso 2) | `authService.restablecerContrasena` | `POST /api/auth/restablecer` | idem |
| Footer / estado | `sistemaService.consultarSalud` | `GET /api/health` | `routes/health.routes.js` |
| Dashboard Usuario | `saldoService.consultarSaldo`, `consultarMovimientos` | `GET /api/saldo`, `GET /api/saldo/movimientos` | `routes/saldo.routes.js` |
| Dashboard Usuario | `apuestaService.listarApuestas` | `GET /api/apuestas?estado=` | `routes/apuesta.routes.js` |
| Dashboard Usuario | `eventoService.listarEventosActivos` | `GET /api/eventos/activos` | `routes/evento.routes.js` |
| MainLayout (saldo del navbar) | `saldoService.consultarSaldo` | `GET /api/saldo` | `routes/saldo.routes.js` |
| Eventos Activos | `eventoService.listarEventosActivos` | `GET /api/eventos/activos` | idem |
| Eventos Activos (detalle) | `eventoService.obtenerOpcionesEvento` | `GET /api/eventos/:id/opciones?monto=` | idem |
| Eventos Finalizados | `eventoService.listarEventosFinalizados` | `GET /api/eventos/finalizados` | idem |
| Crear Apuesta | `listarEventosActivos` + `obtenerOpcionesEvento` | `GET /api/eventos/activos`, `GET /api/eventos/:id/opciones` | idem |
| Crear Apuesta | `saldoService.consultarSaldo` | `GET /api/saldo` (para `idTipoSaldo`) | `routes/saldo.routes.js` |
| Crear Apuesta | `apuestaService.registrarApuesta` | `POST /api/apuestas` | `routes/apuesta.routes.js` |
| Historial de Apuestas | `apuestaService.listarApuestas`, `resumenApuestas` | `GET /api/apuestas` + `/pendientes` + `/ganadas` + `/perdidas` | idem |
| Saldo / Historial de Movimientos | `saldoService.consultarSaldo`, `consultarMovimientos` | `GET /api/saldo`, `GET /api/saldo/movimientos` | `routes/saldo.routes.js` |
| Notificaciones | `notificacionService.listarNotificaciones` | `GET /api/notificaciones?estado=&limite=` | `routes/notificacion.routes.js` |
| Perfil | `saldoService.consultarSaldo` + datos de sesión | `GET /api/saldo` | `routes/saldo.routes.js` |
| Ranking | `reporteService.reporteRanking` | `GET /api/reportes/ranking` | `routes/reporte.routes.js` |
| Dashboard Admin / Reportes | `reporteService.*` | `GET /api/reportes/administrativo`, `/financiero`, `/ranking` | idem |
| Dashboard Admin | `adminService.listarUsuarios` | `GET /api/usuarios?estado=&rol=&limite=` | `routes/usuario.routes.js` |
| Dashboard Admin (recarga) | `adminService.crearRecarga` | `POST /api/recargas` | `routes/recarga.routes.js` |
| Dashboard Admin (resultado) | `eventoService.registrarResultado` | `POST /api/eventos/:id/resultado` | `routes/evento.routes.js` |
| Dashboard Admin (liquidar) | `adminService.liquidarApuestas` | `POST /api/liquidaciones` | `routes/liquidacion.routes.js` |
| Reportes (auditoría) | `adminService.consultarAuditoria` | `GET /api/auditoria?idUsuario=&operacion=&desde=&hasta=&top=` | `routes/auditoria.routes.js` |

Cobertura: **24 de 24 endpoints** del backend usados o consultados por el frontend (health, 4 de auth, usuarios, 2 de saldo, recargas, 5 de apuestas, liquidaciones, 4 de eventos, notificaciones, 3 de reportes, auditoría).

---

## 2. Contratos reales respetados

- **Autenticación:** `POST /api/auth/login` → `{ token, expiraEn, usuario }`. El token se persiste como `apuestadb.token` y viaja en `Authorization: Bearer`.
- **Roles:** el frontend nunca decide autorización real; el backend aplica `autenticar` + `roles('administrador')` en `/usuarios`, `/recargas`, `/liquidaciones`, `/reportes/*`, `/auditoria` y `POST /eventos/:id/resultado`.
- **Formatos de fila:** las vistas devuelven `snake_case` (`id_apuesta`, `cuota_congelada`, `equipo_local`, …) y el frontend normaliza cuando el contrato nuevo lo permite (`saldoService.normalizarCuenta` soporta camelCase y `snake_case`, sin fabricar `idTipoSaldo` si la API no lo entrega).
- **Validaciones replicadas, no inventadas:** los filtros desplegables usan los valores aceptados por el backend (`ESTADOS_APUESTA`, `ESTADOS_USUARIO`, `ESTADOS_RESULTADO`, `ESTADOS_OPERABLES`, `LIMITE_NOTIFICACIONES` en `src/utils/constantes.js`).
- **Recuperación de contraseña:** `POST /api/auth/recuperar` devuelve `{ valorToken, mensaje }`; la pantalla lo muestra para el paso de restablecimiento (simulación académica, sin correo real). No se consume ningún servicio de correo inexistente.
- **Trazabilidad de límites:** las mejoras sin soporte están centralizadas en `LIMITACIONES_API` (`src/utils/constantes.js`) y se muestran en pantalla como avisos; no se reemplazan datos faltantes con valores ficticios.

---

## 3. Correcciones de documentación aplicadas en esta fase

- `services/apuestaService.js`: el comentario afirmaba que `idOpcion` e `idTipoSaldo` no podían obtenerse desde la interfaz (estado previo a la fase 10.1). Actualizado al origen real.
- `services/adminService.js`: el comentario afirmaba que `idTipoSaldo` no era seleccionable; ahora documenta el origen real (`GET /api/saldo`) y la mejora no bloqueante (catálogo global).

Sin cambios de contrato, sin endpoints nuevos y sin modificaciones a la base de datos.
