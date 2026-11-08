# Despliegue de ApuestaDB en Azure

Esta guía prepara, pero no crea, recursos de Azure. Los workflows solo se
ejecutan manualmente (`workflow_dispatch`).

## Arquitectura

- **Backend:** Azure App Service Linux con Node.js 20. El paquete desplegado es
  `backend/` y su comando de inicio es `npm start`.
- **Frontend:** Azure Static Web Apps. El workflow compila `frontend/` con
  Vite y publica `frontend/dist`.
- **SPA:** `frontend/staticwebapp.config.json` redirige rutas desconocidas a
  `index.html`.

## Preparación

1. Crear/configurar los recursos de Azure fuera de este repositorio.
2. Configurar los nombres de secretos y variables descritos en
   [VARIABLES_AZURE.md](./VARIABLES_AZURE.md).
3. Configurar el backend con `NODE_ENV=production`, `PORT` (lo proporciona
   App Service), credenciales de base de datos y `CORS_ORIGINS` con el origen
   exacto de Static Web Apps.
4. Ejecutar manualmente `Deploy backend to Azure App Service` y después
   `Deploy frontend to Azure Static Web Apps`.

No se incluyen URLs, perfiles de publicación, IDs de suscripción/tenant ni
otros valores reales en el repositorio.

## Validación local

```powershell
npm --prefix frontend run build
npm --prefix backend start
```

El backend escucha en `process.env.PORT` cuando está definido y mantiene
`4000` como valor local predeterminado.
