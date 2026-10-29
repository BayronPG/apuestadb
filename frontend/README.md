# ApuestaDB — Frontend (React + Vite)

Interfaz web del proyecto academico **ApuestaDB** (Bases de Datos 2, Tecnologico de
Antioquia). Consume la API REST de `backend/` (24 endpoints) y todas las pantallas
trabajan con **saldo ficticio**: no hay dinero real ni pasarelas de pago.

## Stack

| Elemento | Version | Nota |
|---|---|---|
| React | 18 | Componentes de funcion + hooks |
| Vite | 5 | Bundler y servidor de desarrollo |
| React Router | 6 | Rutas anidadas, `ProtectedRoute` y `RoleRoute` |
| Context API | nativo | Estado de autenticacion (`AuthContext`) |
| Axios | 1.x | Instancia unica en `src/services/api.js` |
| CSS propio | — | Variables CSS + media queries (sin frameworks de UI) |

Dependencias permitidas por el alcance: `react`, `react-dom`, `react-router-dom`,
`axios`. `vite` y `@vitejs/plugin-react` son herramientas de compilacion exigidas
por el stack y van en `devDependencies`.

## Puesta en marcha

```powershell
# 1) API en ejecucion (otra terminal)
cd C:\Proyectos\ApuestaDB\backend
npm install
npm start                 # http://localhost:4000/api

# 2) Frontend
cd C:\Proyectos\ApuestaDB\frontend
Copy-Item .env.example .env
npm install
npm run dev               # http://localhost:5173
```

El proxy de Vite redirige `/api` hacia `http://localhost:4000`, por lo que en
desarrollo no se necesita configurar CORS en el navegador. Si la API vive en otro
host, ajuste `VITE_API_URL` en `.env`.

## Scripts

| Comando | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5173 |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve el resultado de la compilacion |

## Estructura

```
frontend/
├── index.html              · vite.config.js  · package.json
├── .env.example            · .gitignore      · README.md
└── src/
    ├── assets/             Marca del proyecto
    ├── components/         Componentes reutilizables (Navbar, Table, Card, ...)
    ├── layouts/            MainLayout (navbar+sidebar+footer) y AuthLayout
    ├── pages/              15 pantallas + NotFound
    ├── routes/             AppRoutes.jsx y mapa de rutas
    ├── services/           api.js (Axios) + un servicio por agregado
    ├── context/            AuthContext (token/usuario en localStorage)
    ├── hooks/              usePeticion y usePaginacion
    ├── utils/              formato, errores, validaciones, constantes, almacenamiento
    └── styles/             variables.css, global.css, layout.css, components.css
```

## Documentacion

En `docs/frontend/`:

- `ARQUITECTURA_FRONTEND.md` — capas, flujo de una peticion y decisiones.
- `COMPONENTES.md` — props y ejemplos de cada componente.
- `RUTAS.md` — ruta → pagina → rol → endpoints.
- `UX_UI.md` — paleta, tipografia, espaciados, estados y breakpoints.
- `INTEGRACION_API.md` — pantalla ↔ endpoint, errores y endpoints faltantes.

## Limitaciones conocidas

La aplicacion consume los 24 endpoints de la API y no usa datos simulados. Quedan
tres mejoras **no bloqueantes** porque la API todavia no expone esos recursos:

1. Marcar notificaciones como leidas (`/notificaciones` es de solo lectura).
2. Consultar/actualizar el perfil (`/perfil` usa los datos de la sesion).
3. Catalogo global de tipos de saldo (la recarga administrativa toma los tipos de
   `GET /api/saldo` del administrador; los ids son globales).

Detalle y propuestas en `docs/frontend/INTEGRACION_API.md`.

## Flujo de apuesta (Fase 11.1)

`/apuestas/nueva` funciona de extremo a extremo:

1. `GET /api/eventos/activos` — cartelera.
2. `GET /api/eventos/:id/opciones` — mercados, opciones y cuota vigente.
3. `GET /api/eventos/:id/opciones?monto=<n>` — premio potencial calculado por la API.
4. `GET /api/saldo` — tipo de saldo (`idTipoSaldo`) y saldo disponible.
5. `POST /api/apuestas` — `{ idOpcion, idTipoSaldo, monto }`; la cuota se congela y el
   saldo se debita dentro de `usp_Apuesta_Registrar`.

## Alcance

Proyecto academico. No se maneja dinero real, no hay pasarelas de pago y el saldo
existe unicamente como dato de practica en la base `ApuestaDB`.
