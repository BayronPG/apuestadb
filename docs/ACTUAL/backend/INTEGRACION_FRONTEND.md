# ApuestaDB — Integración Frontend ↔ Backend

**Fase 10.1** · Objetivo: que la pantalla **Crear apuesta** del frontend React
deje de depender de datos simulados y pueda registrar apuestas reales contra la
API (`POST /api/apuestas`), sin inventar rutas ni tocar `database/`.

Prefijo base de la API: `/api`. Envoltura uniforme de respuesta:

```json
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": { "codigo": "CODIGO_FUNCIONAL", "mensaje": "Texto legible." } }
```

---

## 1. Endpoints nuevos y modificados (Fase 10.1)

### 1.1 Nuevo — `GET /api/eventos/:id/opciones`

| Aspecto | Detalle |
|---|---|
| Método / ruta | `GET /api/eventos/:id/opciones` |
| Rol | `usuario*` (cualquier sesión válida; middleware `autenticar`) |
| Parámetros | `:id` entero ≥ 1 (validado). Query opcional `monto` (número > 0) |
| Objeto de BD | Consulta parametrizada sobre `Evento`, `Temporada`, `Liga`, `Deporte`, `Equipo`, `Estadio`, `Mercado`, `OpcionApuesta` (no se crean objetos SQL) |
| Capas | `routes/evento.routes.js` → `controllers/evento.controller.js` → `services/evento.service.js` → `repositories/evento.repository.js` |
| 404 | Evento inexistente → `{ ok:false, error:{ codigo:"EVENTO_NO_ENCONTRADO" } }` |
| 400 | `:id` no entero positivo, o `monto` ≤ 0 / no numérico |

Respuesta (nombres en **camelCase**, contrato del frontend):

```json
{
  "ok": true,
  "data": {
    "evento": {
      "idEvento": 12, "deporte": "Fútbol", "liga": "Liga BetPlay",
      "temporada": "2026-I", "equipoLocal": "Atlético Nacional",
      "equipoVisitante": "Millonarios", "estadio": "Atanasio Girardot",
      "fechaHoraInicio": "2026-09-20T20:00:00.000Z", "estado": "programado"
    },
    "mercados": [
      {
        "idMercado": 30, "nombre": "Resultado del partido",
        "descripcion": "Ganador del partido en tiempo reglamentario",
        "fechaApertura": "2026-09-14T12:00:00.000Z",
        "fechaCierre": "2026-09-20T19:55:00.000Z", "estado": "abierto",
        "opciones": [
          { "idOpcion": 91, "etiqueta": "local", "cuotaVigente": 2.10, "estado": "habilitada" }
        ]
      }
    ]
  }
}
```

Detalles de implementación:

- El evento se consulta **sin filtrar por estado** (a diferencia de
  `vw_EventosActivos`, que solo muestra `programado`/`en_curso`), de modo que el
  frontend recibe el `estado` real y puede deshabilitar lo cerrado.
- Cada mercado y cada opción viajan con su **estado** (`abierto`/`cerrado`,
  `habilitada`/`inhabilitada`) para que la interfaz deshabilite sin adivinar.
- `premioPotencial` es **opcional y aditivo**: solo aparece si la petición
  incluye `?monto=<valor>`. Fórmula: `monto × cuotaVigente` (idéntica a
  `dbo.fn_PremioPotencial`). Si no se envía `monto`, el campo se **omite**.
- El orden de mercados es por `fecha_cierre` ascendente y el de opciones por
  `id_opcion` ascendente.

Ejemplo: `GET /api/eventos/12/opciones?monto=50000` añade
`"premioPotencial": 105000` a cada opción.

### 1.2 Modificado — `GET /api/saldo`

Se **conserva** la llamada a `usp_Saldo_Consultar` y se completa cada fila con
una consulta parametrizada (`SaldoCuenta` ⋈ `TipoSaldo` por `id_saldo_cuenta`),
porque el procedimiento devuelve el **nombre** del tipo pero no su id:

```sql
SELECT sc.id_saldo_cuenta, sc.id_tipo_saldo, ts.nombre AS nombre_tipo_saldo
  FROM dbo.SaldoCuenta sc
  JOIN dbo.TipoSaldo  ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
 WHERE sc.id_usuario = @id_usuario
```

- Ambas consultas se lanzan en paralelo (`Promise.all`); el procedimiento sigue
  validando que el usuario exista (error 50030 → HTTP 404).
- **No se elimina ningún campo**: se mantienen `id_saldo_cuenta`, `tipo_saldo`,
  `saldo_actual`, `fecha_ultima_actualizacion` y se **añaden**
  `idSaldoCuenta`, `idTipoSaldo`, `nombreTipoSaldo`, `saldoActual`,
  `fechaUltimaActualizacion`. (`saldoTotal` se calcula igual que antes.)
- Motivo de la duplicación snake_case/camelCase: durante la Fase 10.1 el
  frontend existente sigue leyendo las claves snake_case (`SaldoUsuario.jsx`),
  mientras la pantalla nueva usa `idTipoSaldo`. Eliminar una de las dos formas
  queda para una fase de normalización.

Respuesta:

```json
{
  "ok": true,
  "data": {
    "cuentas": [
      {
        "id_saldo_cuenta": 5, "tipo_saldo": "tokens", "saldo_actual": 120000.00,
        "fecha_ultima_actualizacion": "2026-09-14T18:00:00.000Z",
        "idSaldoCuenta": 5, "idTipoSaldo": 1, "nombreTipoSaldo": "tokens",
        "saldoActual": 120000.00, "fechaUltimaActualizacion": "2026-09-14T18:00:00.000Z"
      }
    ],
    "saldoTotal": 150000.00
  }
}
```

---

## 2. Flujo completo de Crear apuesta (paso a paso)

| # | Pantalla / acción | Endpoint | Objeto de BD | Validaciones | Respuesta usada |
|---|---|---|---|---|---|
| 1 | `CrearApuesta.jsx` carga la cartelera | `GET /api/eventos/activos` | `vw_EventosActivos` | token válido (`autenticar`) | `data.eventos[].id_evento`, equipos, liga, fecha |
| 2 | El usuario elige un evento | — | — | — | `id_evento` seleccionado |
| 3 | La pantalla pide el catálogo del evento | `GET /api/eventos/:id/opciones` (**nuevo**) | consulta parametrizada `Evento`+catálogos, `Mercado`, `OpcionApuesta` | `:id` entero ≥ 1; 404 si no existe | `data.mercados[].opciones[]` con `idOpcion`, `cuotaVigente`, `estado` |
| 4 | (Opcional) el usuario escribe el monto y se recalcula el premio | `GET /api/eventos/:id/opciones?monto=…` | ídem | `monto` número > 0 | `data.mercados[].opciones[].premioPotencial` |
| 5 | La pantalla carga las cuentas de saldo | `GET /api/saldo` (**modificado**) | `usp_Saldo_Consultar` + consulta parametrizada | token válido; 404 si el usuario no existe | `data.cuentas[].idTipoSaldo`, `nombreTipoSaldo`, `saldoActual` |
| 6 | El usuario elige opción, tipo de saldo y monto | — | — | monto > 0 (validación cliente y servidor); casilla de confirmación de saldo ficticio | `idOpcion`, `idTipoSaldo`, `monto` |
| 7 | Confirma la apuesta | `POST /api/apuestas` | `usp_Apuesta_Registrar` (congela la cuota y debita el saldo de forma atómica) | `idOpcion` e `idTipoSaldo` enteros ≥ 1; `monto` > 0; el procedimiento valida opción habilitada, mercado abierto, evento no iniciado y saldo suficiente | `201 { idApuesta, mensaje }` |
| 8 | La pantalla confirma y ofrece ver el historial | `GET /api/apuestas` o `/pendientes` | `usp_Apuesta_Historial` / `vw_ApuestasPendientes` | token válido | `data.apuestas[]` |

Errores que el frontend debe saber mostrar en el paso 7 (mapeados en
`utils/sqlErrorMapper.js`):

| Código | HTTP | Significado |
|---|---|---|
| `OPCION_NO_ENCONTRADA` | 404 | La opción ya no existe |
| `OPCION_NO_HABILITADA` | 400 | Opción inhabilitada |
| `MERCADO_CERRADO` | 409 | Mercado cerrado o ya cerró |
| `EVENTO_NO_DISPONIBLE` / `EVENTO_INICIADO` | 409 | El evento no admite apuestas |
| `SALDO_INSUFICIENTE` | 409 | Saldo insuficiente en el tipo elegido |
| `CUENTA_NO_ENCONTRADA` | 404 | El usuario no tiene cuenta de ese tipo de saldo |
| `MONTO_INVALIDO` | 400 | Monto ≤ 0 |

---

## 3. Tabla pantalla ↔ endpoint

| Pantalla (`frontend/src/pages`) | Endpoints que necesita | Estado tras Fase 10.1 |
|---|---|---|
| `CrearApuesta.jsx` | `GET /api/eventos/activos`, **`GET /api/eventos/:id/opciones`**, **`GET /api/saldo`**, `POST /api/apuestas` | **Completo**: se puede apostar sin datos simulados |
| `EventosActivos.jsx` | `GET /api/eventos/activos`, `GET /api/eventos/:id/opciones` | Completo |
| `EventosFinalizados.jsx` | `GET /api/eventos/finalizados` | Completo |
| `DashboardUsuario.jsx` | `GET /api/saldo`, `GET /api/apuestas/*` | Completo |
| `SaldoUsuario.jsx` | `GET /api/saldo` | Completo (claves snake_case intactas) |
| `HistorialMovimientos.jsx` | `GET /api/saldo/movimientos` | Completo (filtro por tipo sigue sin selector; ver §5) |
| `HistorialApuestas.jsx` | `GET /api/apuestas?estado=` | Completo |
| `Notificaciones.jsx` | `GET /api/notificaciones` | Completo (solo lectura; no hay endpoint para marcar leída) |
| `DashboardAdministrador.jsx` | `GET /api/reportes/*`, `GET /api/usuarios`, `GET /api/auditoria`, `POST /api/recargas`, `POST /api/liquidaciones`, `POST /api/eventos/:id/resultado` | Completo (la recarga sigue sin selector de tipo; ver §5) |
| `RankingUsuarios.jsx` | `GET /api/reportes/ranking` | Completo |

---

## 4. ¿React puede consumir el backend sin datos simulados?

**Sí, para la pantalla Crear apuesta.** Los tres datos que antes eran
imposibles de obtener ya están disponibles:

- la **opción** (`idOpcion`) y su **cuota vigente** → `GET /api/eventos/:id/opciones`;
- el **tipo de saldo** (`idTipoSaldo`) y su **saldo** → `GET /api/saldo`;
- el **evento** de la cartelera → `GET /api/eventos/activos` (ya existía).

`POST /api/apuestas` ya estaba implementado y solo esperaba esos dos
identificadores. No se requiere ninguna ruta inexistente ni dato fabricado.

---

## 5. Limitaciones y supuestos

1. **No se modificó `database/`**: el catálogo de mercados/opciones se lee con
   consultas parametrizadas (precedente de `notificacion.repository.js`). Si en
   una fase posterior se crea `dbo.usp_Mercado_ConsultarPorEvento` o una vista
   equivalente, basta sustituir el método del repositorio.
2. **No existe `GET /api/saldo/tipos`**: el `idTipoSaldo` ahora llega con cada
   cuenta de `GET /api/saldo`, lo que cubre apostar. Para **recargar** desde el
   panel administrador (`POST /api/recargas`) sobre un usuario distinto se
   seguiría necesitando un catálogo de tipos de saldo. Queda **pendiente** y
   documentado; no forma parte del alcance de la Fase 10.1.
3. **`premioPotencial`** solo se calcula si el cliente envía `monto`; el cálculo
   definitivo y autoritativo sigue ocurriendo en SQL Server al liquidar
   (`fn_PremioPotencial` sobre la cuota congelada). La API no lo devuelve por
   defecto para no inventar un monto.
4. **Duplicación de claves en `GET /api/saldo`** (snake_case + camelCase) es
   deliberada y temporal, para no romper consumidores existentes.
5. **Sin pruebas de ejecución contra SQL Server**: la verificación de esta fase
   fue estática (`node --check`, conteo de rutas y contraste de columnas contra
   `database/02_tables.sql`). No se ejecutó `npm install` ni se abrió conexión.
