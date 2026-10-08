# ApuestaDB — Arquitectura del frontend

Documento de referencia de la aplicacion React (`frontend/`). **Fase 11**.

---

## 1. Vision general

El frontend es una SPA construida con **Vite + React 18** que consume la API REST
de `backend/` (24 endpoints, prefijo `/api`). No contiene reglas de negocio: la
logica sensible (cuota congelada, saldo suficiente, mercado abierto, derivacion de
la opcion ganadora, liquidacion) vive en SQL Server y llega resuelta por la API.

- Estado global: **Context API** (solo autenticacion).
- Estado de datos: **hooks locales** (`usePeticion`) por pantalla.
- Comunicacion HTTP: **instancia unica de Axios** con interceptores.
- Estilos: **CSS propio** con variables y media queries (sin frameworks de UI).

---

## 2. Capas

```
Componente de pagina (src/pages/*.jsx)
   |
   v  usa hooks y componentes presentacionales
hooks/usePeticion.js · usePaginacion.js      (estado de carga/error/paginacion)
   |
   v
services/*.js                                (una funcion por endpoint; sin JSX)
   |
   v
services/api.js                              (Axios + interceptores + desenvolver)
   |
   v
API REST (backend/ -> SQL Server ApuestaDB)
```

| Capa | Carpeta | Responsabilidad | Prohibido |
|---|---|---|---|
| Rutas | `src/routes/` | Declarar el arbol de rutas y protegerlas | Logica de datos |
| Layouts | `src/layouts/` | Estructura visual (navbar/sidebar/footer, panel de autenticacion) | Llamadas a la API |
| Paginas | `src/pages/` | Componer una pantalla concreta y conectar servicios | HTML de detalle reutilizable |
| Componentes | `src/components/` | UI reutilizable y sin conocimiento de la API | Llamadas directas a Axios |
| Contexto | `src/context/` | Sesion (token y usuario) y su persistencia | Fetch de negocio |
| Hooks | `src/hooks/` | Estado de peticion y paginacion | Reglas de negocio |
| Servicios | `src/services/` | Traducir endpoints a funciones JavaScript | JSX, formateo de UI |
| Utilidades | `src/utils/` | Formato, errores, validaciones, constantes | Estado de React |
| Estilos | `src/styles/` | Tokens y clases | Estilos en linea salvo ajustes puntuales |

Regla de dependencia: `pages -> hooks -> services -> api`. Los componentes nunca
importan servicios; las utilidades nunca importan React.

---

## 3. Flujo de una peticion (ejemplo real)

`/eventos` (pantalla `EventosActivos.jsx`) consulta la cartelera:

1. **`EventosActivos.jsx`** define `const cargar = useCallback(() => listarEventosActivos(), [])`
   y lo entrega a `usePeticion(cargar, [])`.
2. **`hooks/usePeticion.js`** marca `cargando = true`, ejecuta la funcion y captura
   el resultado o el error normalizado. Devuelve `{ datos, cargando, error, recargar }`.
3. **`services/eventoService.js`** ejecuta `api.get('/eventos/activos')`.
4. **`services/api.js`** (interceptor de REQUEST) agrega
   `Authorization: Bearer <token>` leido de `localStorage`.
5. La API responde `{ ok: true, data: { eventos, total } }` (o `{ ok: false, error }`).
6. **`desenvolver()`** devuelve unicamente `data`; si `ok` no es `true`, lanza un error.
7. La pagina renderiza `<Table>` / tarjetas con los estados `loading`, vacio o error.
8. Ante **401** en una ruta protegida, el interceptor de RESPONSE borra la sesion,
   avisa al `AuthContext` (que limpia `usuario`/`token`) y el usuario vuelve a `/login`.
   Las rutas publicas de autenticacion se excluyen para poder mostrar el mensaje
   "credenciales invalidas" dentro del formulario.

---

## 4. Decisiones de diseno

1. **Una funcion por endpoint** (`services/*Service.js`). El nombre de la funcion
   refleja la forma real de la respuesta; el mapeo endpoint ↔ pantalla esta en
   `INTEGRACION_API.md`.
2. **Sin estado global de datos.** Estan descartadas librerias de estado (Redux y
   similares) por el alcance obligatorio; cada pantalla maneja su propia carga.
   El unico contexto global es `AuthContext`.
3. **Token en `localStorage`** con claves `apuestadb.token` y `apuestadb.usuario`.
   Se conserva el objeto `usuario` que devuelve el login para poder pintar la sesion
   sin otra peticion. `logout()` y cualquier 401 limpian ambas claves.
4. **Sesion sin endpoint de refresco.** El backend emite un JWT con vigencia
   (`expiraEn`); al vencer, el 401 desemboca en `/login`. No se inventa un endpoint
   de refresh.
5. **Nombres de campos tal como los devuelve la API.** El contrato no es
   homogeneo (Fase 11.1): `GET /api/eventos/:id/opciones` y los campos nuevos de
   `GET /api/saldo` llegan en `camelCase` (`idOpcion`, `cuotaVigente`,
   `idTipoSaldo`, `nombreTipoSaldo`), mientras que las vistas y procedimientos
   previos mantienen `snake_case` (`id_apuesta`, `monto_apostado`, `saldo_total`,
   ...). Los envoltorios son siempre `camelCase` (`apuestas`, `filas`, `registros`,
   `cuentas`, `mercados`, `eventos`, `saldoTotal`). El codigo respeta la forma real
   de cada endpoint; `saldoService.normalizarCuenta()` admite las dos variantes de
   `/saldo` sin fabricar valores.
6. **Componentes sin logica de datos.** `Table` recibe `columnas` con funciones
   `render`, de modo que cada pantalla decide como formatear sus columnas.
7. **CSS con tokens.** Toda decision visual (color, espaciado, radio, sombra) sale de
   `styles/variables.css`; las media queries usan 480 / 768 / 1024 px.
8. **Rutas por rol en la interfaz, autorizacion en la API.** `RoleRoute` evita la
   pantalla, pero el control real lo hace `middlewares/roles.js` del backend.
9. **Ya no hay pantallas «requiere endpoints».** La Fase 10.1 aporto
   `GET /api/eventos/:id/opciones` y el `idTipoSaldo` dentro de `GET /api/saldo`, de
   modo que Crear apuesta, la recarga administrativa y el filtro por tipo de saldo
   funcionan con datos reales. Siguen sin endpoint tres mejoras **no bloqueantes**
   (marcar notificacion como leida, perfil y catalogo global de tipos de saldo),
   declaradas en `utils/constantes.js` (`LIMITACIONES_API`) y en
   `INTEGRACION_API.md`.

---

## 5. Estructura de carpetas

```
frontend/
├── index.html
├── vite.config.js              Proxy /api -> http://localhost:4000
├── package.json                react, react-dom, react-router-dom, axios
├── .env.example                VITE_API_URL=/api
├── .gitignore
├── README.md
└── src/
    ├── assets/                 logo-apuestadb.svg, README.md
    ├── components/             15 componentes + index.js (barrel)
    ├── context/                AuthContext.jsx
    ├── hooks/                  usePeticion.js, usePaginacion.js, index.js
    ├── layouts/                MainLayout.jsx, AuthLayout.jsx
    ├── pages/                  15 paginas + NotFound.jsx
    ├── routes/                 AppRoutes.jsx, rutas.js
    ├── services/               api.js + authService, saldoService, apuestaService,
    │                           eventoService, notificacionService, reporteService,
    │                           adminService, sistemaService
    ├── styles/                 variables.css, global.css, layout.css, components.css
    ├── utils/                  almacenamiento.js, errores.js, formato.js,
    │                           validaciones.js, constantes.js
    ├── App.jsx
    └── main.jsx
```

---

## 6. Manejo de errores y estados

| Estado | Como se representa |
|---|---|
| `loading` | `<Loader>` en bloque o en linea dentro de la tarjeta |
| Vacío | `<EmptyState>` con titulo, mensaje y accion opcional |
| Error | `<Alert tipo="error">` con el `error.mensaje` normalizado |
| `disabled` | `btn:disabled` y `campo__control:disabled` (opacidad 0.55, cursor `not-allowed`) |
| Hover | Cambio de fondo/borde en enlaces, botones, filas y tarjetas |
| Foco | `:focus-visible` con `--anillo-foco` (verde, 3 px) |

`utils/errores.js` convierte cualquier fallo en
`{ codigo, mensaje, detalles, estado }`, con mensajes propios para tiempo agotado y
API no disponible.

---

## 7. Verificacion

1. **Resolucion de imports:** script temporal en Node que recorre `src/**` y valida
   que cada import/export relativo apunte a un archivo existente (resultado literal
   en el informe de la fase).
2. **Compilacion:** `npm install --no-audit --no-fund` y `npm run build`.
3. **Sin backend requerido para compilar:** el build no ejecuta peticiones.
