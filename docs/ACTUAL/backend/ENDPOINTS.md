# ApuestaDB — Endpoints de la API

Prefijo base: `/api`. Total: **24 endpoints** (23 + 1 de la Fase 10.1).

Formato uniforme de respuesta:

```json
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": { "codigo": "CODIGO_FUNCIONAL", "mensaje": "Texto legible." } }
```

Roles: `—` público · `usuario` sesión válida (cualquier rol) · `usuario*` cualquier
rol autenticado · `admin` solo `administrador`.

---

## 1. Autenticación (público)

| Método | Ruta | Rol | Cuerpo | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| POST | `/api/auth/registro` | — | `nombres`, `apellidos`, `correo`, `contrasena`, `telefono?` | `usp_Usuario_Registrar` (hash bcrypt calculado en backend) | 201 `{ idUsuario, mensaje }` · 400 validación · 409 correo/teléfono registrado |
| POST | `/api/auth/login` | — | `correo`, `contrasena` | `SELECT Usuario+Rol` parametrizado + `bcrypt.compare` + `usp_Auditoria_Registrar` | 200 `{ token, expiraEn, usuario }` · 401 credenciales inválidas · 403 inhabilitado |
| POST | `/api/auth/recuperar` | — | `correo` | `usp_Auth_RecuperarContrasena @accion='solicitar'` | 200 `{ valorToken, mensaje }` · 404 sin usuario activo |
| POST | `/api/auth/restablecer` | — | `correo`, `valorToken`, `nuevaContrasena` | `usp_Auth_RecuperarContrasena @accion='restablecer'` (hash bcrypt en backend) | 200 `{ mensaje }` · 400 token inválido o expirado |

> **Supuesto académico:** `POST /api/auth/recuperar` devuelve el token en la
> respuesta (no hay servidor de correo). En producción el token solo se enviaría
> por correo. La vigencia es de 30 minutos, definida en el procedimiento.

---

## 2. Saldo y movimientos (usuario autenticado)

| Método | Ruta | Rol | Cuerpo / Query | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| GET | `/api/saldo` | usuario* | — | `usp_Saldo_Consultar` + consulta parametrizada `SaldoCuenta`⋈`TipoSaldo` | 200 `{ cuentas[], saldoTotal }` · 404 usuario inexistente |
| GET | `/api/saldo/movimientos` | usuario* | `idTipoSaldo?`, `desde?`, `hasta?` | `usp_MovimientoSaldo_Historial` | 200 `{ movimientos[], total }` · 400 rango inválido |

El `id_usuario` se toma siempre del token; no se acepta por parámetro.

> **Fase 10.1 — `GET /api/saldo`:** cada fila de `cuentas[]` **añade**
> `idSaldoCuenta`, `idTipoSaldo`, `nombreTipoSaldo`, `saldoActual` y
> `fechaUltimaActualizacion` (camelCase), manteniendo los campos snake_case
> originales (`id_saldo_cuenta`, `tipo_saldo`, `saldo_actual`,
> `fecha_ultima_actualizacion`). `id_tipo_saldo` no lo devuelve
> `usp_Saldo_Consultar`: se completa con una consulta parametrizada sobre
> `dbo.SaldoCuenta` y `dbo.TipoSaldo` por `id_saldo_cuenta`. El procedimiento no
> se modifica. Detalle en `INTEGRACION_FRONTEND.md` §1.2.

---

## 3. Recargas (administrador)

| Método | Ruta | Rol | Cuerpo | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| POST | `/api/recargas` | admin | `idUsuario`, `idTipoSaldo`, `monto`, `observacion?` | `usp_Recarga_Crear` (`@id_administrador` = token) | 201 `{ idRecarga, mensaje }` · 400 monto/tipo inválido · 404 usuario o cuenta inexistente |

---

## 4. Apuestas (usuario autenticado)

| Método | Ruta | Rol | Cuerpo / Query | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| POST | `/api/apuestas` | usuario* | `idOpcion`, `idTipoSaldo`, `monto` | `usp_Apuesta_Registrar` | 201 `{ idApuesta, mensaje }` · 400 monto inválido · 404 opción/cuenta inexistente · 409 saldo insuficiente, mercado cerrado, evento iniciado |
| GET | `/api/apuestas?estado=` | usuario* | `estado?` = `pendiente`\|`ganada`\|`perdida`\|`anulada` | `usp_Apuesta_Historial` | 200 `{ apuestas[], total }` · 404 usuario inexistente |
| GET | `/api/apuestas/pendientes` | usuario* | — | `vw_ApuestasPendientes` | 200 `{ apuestas[], total }` |
| GET | `/api/apuestas/ganadas` | usuario* | — | `vw_ApuestasGanadas` | 200 `{ apuestas[], total }` |
| GET | `/api/apuestas/perdidas` | usuario* | — | `vw_ApuestasPerdidas` | 200 `{ apuestas[], total }` |

Si `estado` no pertenece al dominio, se responde 200 con lista vacía (filtro no aplicable).

---

## 5. Eventos

| Método | Ruta | Rol | Cuerpo | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| GET | `/api/eventos/activos` | usuario* | — | `vw_EventosActivos` | 200 `{ eventos[], total }` |
| GET | `/api/eventos/finalizados` | usuario* | — | `vw_EventosFinalizados` | 200 `{ eventos[], total }` |
| GET | `/api/eventos/:id/opciones` | usuario* | `monto?` (número > 0) | Consulta parametrizada `Evento`+`Temporada`+`Liga`+`Deporte`+`Equipo`+`Estadio` y `Mercado` LEFT JOIN `OpcionApuesta` | 200 `{ evento, mercados[] }` · 400 `:id`/`monto` inválido · 404 evento inexistente |
| POST | `/api/eventos/:id/resultado` | admin | `marcadorLocal`, `marcadorVisitante`, `estado?` (`oficial`\|`provisional`) | `usp_Evento_RegistrarResultado` (`@id_administrador` = token) | 201 `{ idResultado, mensaje }` · 400 marcador/estado inválido · 404 evento inexistente · 409 evento cancelado o resultado ya registrado |

> **Fase 10.1 — `GET /api/eventos/:id/opciones` (nuevo):** catálogo que
> necesita la pantalla *Crear apuesta*. Devuelve el evento (camelCase, sin
> filtrar por estado) y `mercados[]` con `opciones[]` (`idOpcion`, `etiqueta`,
> `cuotaVigente`, `estado`). Con `?monto=<número>` cada opción añade
> `premioPotencial` (`monto × cuotaVigente`, igual que `fn_PremioPotencial`); sin
> `monto`, el campo se omite. Detalle en `INTEGRACION_FRONTEND.md` §1.1.

---

## 6. Liquidaciones (administrador)

| Método | Ruta | Rol | Cuerpo | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| POST | `/api/liquidaciones` | admin | `idApuesta` **o** `idEvento` (excluyentes) | `usp_Apuesta_Liquidar` (`@id_administrador` = token) | 200 `{ apuestasLiquidadas, mensaje }` · 400 criterio ausente o ambos · 404 apuesta/evento inexistente · 409 apuesta ya liquidada |

---

## 7. Notificaciones (usuario autenticado)

| Método | Ruta | Rol | Query | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| GET | `/api/notificaciones` | usuario* | `estado?`, `limite?` | `Notificacion` (consulta parametrizada) | 200 `{ notificaciones[], total }` |

> No existe vista ni procedimiento de consulta de notificaciones (solo el de
> creación); ver `ARQUITECTURA.md` §7.

---

## 8. Reportes (administrador)

| Método | Ruta | Rol | Objeto de BD | Respuestas |
|---|---|---|---|---|
| GET | `/api/reportes/administrativo` | admin | `vw_ReporteAdministrativo` | 200 `{ filas[], total }` |
| GET | `/api/reportes/financiero` | admin | `vw_ReporteFinanciero` | 200 `{ filas[], total }` |
| GET | `/api/reportes/ranking` | admin | `vw_RankingUsuarios` | 200 `{ filas[], total }` |

---

## 9. Auditoría (administrador)

| Método | Ruta | Rol | Query | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| GET | `/api/auditoria` | admin | `idUsuario?`, `operacion?`, `desde?`, `hasta?`, `top?` | `usp_Auditoria_Consultar` | 200 `{ registros[], total }` · 400 rango de fechas inválido |

`top` se normaliza a 100 por defecto y a 1000 como máximo dentro del procedimiento.

---

## 10. Usuarios (administrador)

| Método | Ruta | Rol | Query | Objeto de BD | Respuestas |
|---|---|---|---|---|---|
| GET | `/api/usuarios` | admin | `estado?`, `rol?`, `limite?` | `Usuario` + `Rol` + `vw_SaldoConsolidado` | 200 `{ usuarios[], total }` |

---

## 11. Sistema

| Método | Ruta | Rol | Objeto de BD | Respuestas |
|---|---|---|---|---|
| GET | `/api/health` | — | `SELECT 1` (verificación de conectividad) | 200 `{ servicio, version, entorno, hora, uptimeSegundos, baseDatos{...} }` |

`data.baseDatos.estado` ∈ `conectada` | `sin_respuesta` | `no_disponible`.
El endpoint responde 200 aunque la base no esté disponible (la API sigue viva).

---

## 12. Resumen de conteo

| Grupo | Endpoints |
|---|---|
| Autenticación | 4 |
| Saldo | 2 |
| Recargas | 1 |
| Apuestas | 5 |
| Eventos | 4 |
| Liquidaciones | 1 |
| Notificaciones | 1 |
| Reportes | 3 |
| Auditoría | 1 |
| Usuarios | 1 |
| Sistema | 1 |
| **Total** | **24** |
