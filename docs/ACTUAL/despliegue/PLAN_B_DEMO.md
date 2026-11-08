# Plan B para una demo

Si Azure no está disponible durante la demostración:

1. Ejecutar SQL Server local y cargar la configuración local del backend.
2. Iniciar el backend con `npm start` desde `backend/`.
3. Iniciar Vite con `npm run dev` desde `frontend/`.
4. Mantener `VITE_API_URL` vacío o usar `/api`; el proxy local de Vite apunta al
   backend local.
5. Verificar `GET /api/health` antes de iniciar la presentación.

Este plan no crea recursos ni sustituye la configuración de producción.
