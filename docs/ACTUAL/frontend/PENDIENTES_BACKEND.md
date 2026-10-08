# PENDIENTES_BACKEND.md — Endpoints que el frontend todavía necesita (Fase 11)

**Fecha:** 14/sep/2026
**Regla:** aquí se listan **solo** capacidades que el frontend ya tiene diseñadas y no puede completar por falta de endpoint. No se implementan sustitutos, no se inventan datos y ninguna de estas faltas bloquea el resto del sistema.

Las tres están declaradas también en código: `LIMITACIONES_API` (`frontend/src/utils/constantes.js`).

---

## 1. Notificaciones — marcar como leída

| Campo | Detalle |
|---|---|
| Pantalla afectada | `/notificaciones` (`pages/Notificaciones.jsx`) |
| Endpoint existente | `GET /api/notificaciones?estado=&limite=` (solo lectura) |
| Falta | `PATCH /api/notificaciones/:id` (o `POST /api/notificaciones/:id/leida`) |
| Efecto visible | La bandeja funciona completa; al intentar marcar aparece el aviso "Acción no disponible" |
| Bloquea | ❌ No. Solo lectura, filtros y estados funcionan |
| Backend a tocar | `backend/routes/notificacion.routes.js`, `controllers/notificacion.controller.js`, `repositories/notificacion.repository.js` |
| BD | Columna `dbo.Notificacion.estado` ya existe (`no_leida` / `leida`); no requiere DDL |

## 2. Perfil — consultar y actualizar

| Campo | Detalle |
|---|---|
| Pantalla afectada | `/perfil` (`pages/PerfilUsuario.jsx`) |
| Endpoint existente | Ninguno de perfil propio (`GET /api/usuarios` es solo administrador) |
| Falta | `GET /api/usuarios/perfil` y `PUT /api/usuarios/perfil` (nombres, apellidos, teléfono) |
| Efecto visible | El perfil muestra los datos que devolvió el login y el saldo; los cambios no se pueden guardar |
| Bloquea | ❌ No. La pantalla es informativa y consistente con la sesión |
| Backend a tocar | `backend/routes/usuario.routes.js` (hoy solo `GET /`), `services/usuario.service.js`, `repositories/usuario.repository.js` |
| Nota | Cambio de contraseña debería pasar por el flujo de `POST /api/auth/restablecer`, no por este endpoint |

## 3. Catálogo global de tipos de saldo

| Campo | Detalle |
|---|---|
| Pantallas afectadas | Recarga en `/admin` (`DashboardAdministrador.jsx`) y selección de tipo en `/apuestas/nueva` |
| Endpoint existente | `GET /api/saldo` devuelve las cuentas **del usuario autenticado**, con `idTipoSaldo` y `nombreTipoSaldo` |
| Falta | `GET /api/saldo/tipos` (catálogo completo: tokens, PSE, y los que defina el profesor) |
| Efecto visible | La recarga administrativa construye el selector con los tipos vistos en las cuentas del administrador; si un tipo no aparece en esas cuentas, no se puede elegir |
| Bloquea | ❌ No. La recarga opera con los tipos disponibles en las cuentas del administrador |
| Backend a tocar | `backend/routes/saldo.routes.js`, `controllers/saldo.controller.js`, `repositories/saldo.repository.js` |
| BD | Tabla de tipos de saldo ya existe; solo falta el `SELECT` de catálogo |

---

## 4. Lo que NO falta (aclaración para evitar retrabajo)

- **Crear Apuesta:** resuelto en la fase 10.1 — `idOpcion` viene de `GET /api/eventos/:id/opciones` y `idTipoSaldo` de `GET /api/saldo`.
- **Historial de apuestas:** `GET /api/apuestas`, `/pendientes`, `/ganadas`, `/perdidas` cubren todos los filtros usados.
- **Reportes, ranking, auditoría, usuarios, recargas y liquidaciones:** los 24 endpoints existentes cubren las pantallas administrativas.
- No se requiere ningún endpoint de pagos, correo real ni proveedor externo de cuotas (fuera del alcance académico).

## 5. Prioridad sugerida

1. `PATCH /api/notificaciones/:id` — pequeña, alto valor demostrativo en la exposición.
2. `GET /api/saldo/tipos` — pequeña, mejora la recarga administrativa.
3. `GET/PUT /api/usuarios/perfil` — mediana, implica validaciones nuevas.

Toda implementación requiere autorización explícita de Jhon (regla 4 del flujo de interfaz: no se modifican contratos del backend sin autorización).
