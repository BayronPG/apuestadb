# PENDIENTES_BACKEND.md — Endpoints pendientes del frontend (Fase 11)

**Fecha:** 14/sep/2026
**Regla:** aquí se listan **solo** capacidades que el frontend ya tiene diseñadas y no puede completar por falta de endpoint. No se implementan sustitutos, no se inventan datos y ninguna de estas faltas bloquea el resto del sistema.

Los tres endpoints descritos abajo ya fueron implementados en el backend.

---

## 1. Notificaciones — marcar como leída

| Campo | Detalle |
|---|---|
| Pantalla afectada | `/notificaciones` (`pages/Notificaciones.jsx`) |
| Endpoint existente | `GET /api/notificaciones?estado=&limite=` (solo lectura) |
| Falta | Resuelto: `PATCH /api/notificaciones/:id` |
| Efecto visible | El backend permite cambiar exclusivamente `estado` de una notificación propia |
| Bloquea | ✅ No |
| Backend a tocar | `backend/routes/notificacion.routes.js`, `controllers/notificacion.controller.js`, `repositories/notificacion.repository.js` |
| BD | Columna `dbo.Notificacion.estado` ya existe (`no_leida` / `leida`); no requiere DDL |

## 2. Perfil — consultar y actualizar

| Campo | Detalle |
|---|---|
| Pantalla afectada | `/perfil` (`pages/PerfilUsuario.jsx`) |
| Endpoint existente | Ninguno de perfil propio (`GET /api/usuarios` es solo administrador) |
| Falta | Resuelto: `GET /api/usuarios/perfil` y `PUT /api/usuarios/perfil` (nombres, apellidos, teléfono) |
| Efecto visible | El backend consulta y actualiza únicamente el perfil del usuario autenticado |
| Bloquea | ✅ No |
| Backend a tocar | `backend/routes/usuario.routes.js` (hoy solo `GET /`), `services/usuario.service.js`, `repositories/usuario.repository.js` |
| Nota | Cambio de contraseña debería pasar por el flujo de `POST /api/auth/restablecer`, no por este endpoint |

## 3. Catálogo global de tipos de saldo

| Campo | Detalle |
|---|---|
| Pantallas afectadas | Recarga en `/admin` (`DashboardAdministrador.jsx`) y selección de tipo en `/apuestas/nueva` |
| Endpoint existente | `GET /api/saldo` devuelve las cuentas **del usuario autenticado**, con `idTipoSaldo` y `nombreTipoSaldo` |
| Falta | Resuelto: `GET /api/saldo/tipos` |
| Efecto visible | El backend devuelve el catálogo vigente de `TipoSaldo` |
| Bloquea | ✅ No |
| Backend a tocar | `backend/routes/saldo.routes.js`, `controllers/saldo.controller.js`, `repositories/saldo.repository.js` |
| BD | Tabla de tipos de saldo ya existe; solo falta el `SELECT` de catálogo |

---

## 4. Lo que NO falta (aclaración para evitar retrabajo)

- **Crear Apuesta:** resuelto en la fase 10.1 — `idOpcion` viene de `GET /api/eventos/:id/opciones` y `idTipoSaldo` de `GET /api/saldo`.
- **Historial de apuestas:** `GET /api/apuestas`, `/pendientes`, `/ganadas`, `/perdidas` cubren todos los filtros usados.
- **Reportes, ranking, auditoría, usuarios, recargas y liquidaciones:** los 24 endpoints existentes cubren las pantallas administrativas.
- No se requiere ningún endpoint de pagos, correo real ni proveedor externo de cuotas (fuera del alcance académico).

## 5. Estado de implementación

1. `PATCH /api/notificaciones/:id` — implementado y restringido al usuario autenticado.
2. `GET /api/saldo/tipos` — implementado con catálogo vigente desde `TipoSaldo`.
3. `GET/PUT /api/usuarios/perfil` — implementados con validación y campos permitidos.

La integración visual del frontend puede consumir estos endpoints en una iteración posterior.
