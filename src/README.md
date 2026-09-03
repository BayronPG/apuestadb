# src — ApuestaDB

Carpeta de implementación (sandbox técnico y académico autorizado por Jhon,
02/sep/2026). El desarrollo formal del proyecto seguirá sujeto a las fases
académicas; esta carpeta contiene material de aprendizaje funcional.

## Estructura

- `frontend/` — Aplicación React (Vite). Pantallas: inicio de sesión, registro,
  recuperar (maqueta), home (protegida) y exportación a Excel (solo admin).
  El login y el registro consultan el backend real (`/api` con proxy de Vite).
- `backend/` — API Node.js + Express conectada a SQL Server (`ApuestaDB`).
  Registro con hash bcrypt, sesión por cookie httpOnly, roles desde la BD y
  exportación de tablas a `.xlsx`. Ver `backend/README.md`.

## Puesta en marcha (desarrollo)

1. Backend: `cd src/backend && npm install && npm start` (puerto 3000).
2. Frontend: `cd src/frontend && npm install && npm run dev` (puerto 5173).
3. Abrir http://localhost:5173
