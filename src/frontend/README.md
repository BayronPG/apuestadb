# Frontend — ApuestaDB (React + Vite)

Aplicación de interfaz del sandbox académico ApuestaDB. Construida con **React 19 + Vite** y enrutada con `react-router-dom`.

## Pantallas y rutas

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Inicio de sesión (login real contra el backend) | público |
| `/registrar` | Registro de usuario | público |
| `/recuperar` | Recuperar contraseña (maqueta visual) | público |
| `/home` | Eventos, saldo y sesión | requiere sesión activa (guarda `RequisitoSesion`) |

- El login y el registro consultan el **backend real** (`POST /api/auth/login`, `POST /api/auth/registro`) y la sesión se conserva en una cookie httpOnly.
- `Home` muestra el nombre y el rol del usuario obtenidos desde la base de datos, y permite cerrar sesión.

## Puesta en marcha (desarrollo)

1. Requiere el backend activo en `http://localhost:3000` (ver `../backend/README.md`).
2. Instalar y ejecutar:

```bash
npm install
npm run dev        # http://localhost:5173
```

3. En desarrollo, Vite reenvía las llamadas `/api` al backend mediante proxy (definido en `vite.config.js`), lo que evita configurar CORS.

## Comandos útiles

```bash
npm run build      # compila a dist/
npm run lint       # oxlint (0 errores esperados)
npm run preview    # previsualiza el build
```

## Estructura

```
src/
  main.jsx                # punto de entrada (BrowserRouter)
  App.jsx                 # rutas y AuthProvider
  context/AuthContext.jsx # sesión: usuario, refrescar, cerrarSesion
  components/
    InicioSesion.jsx/.css # login
    Registro.jsx/.css     # registro
    Recuperar.jsx/.css    # maqueta de recuperación
    Home.jsx/.css         # pantalla principal (protegida)
    RequisitoSesion.jsx   # guarda de rutas privadas
```

## Notas

- No contiene credenciales ni datos reales: todo es ficticio y académico.
- La pantalla "Recuperar contraseña" es una maqueta; la funcionalidad real no está implementada.
