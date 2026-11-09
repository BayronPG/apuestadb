# Variables para Azure

Configure los siguientes valores en GitHub/Azure, nunca en archivos versionados.

## Secretos de GitHub Actions

| Nombre | Uso |
|---|---|
| `AZURE_WEBAPP_NAME` | Nombre del App Service del backend |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Perfil de publicación del App Service |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Token de despliegue de Static Web Apps |

## Variables de GitHub Actions

| Nombre | Uso |
|---|---|
| `VITE_API_URL` | URL base de la API, incluyendo `/api` si corresponde |

## Configuración del backend

`CORS_ORIGINS` acepta una lista separada por comas, por ejemplo una lista de
orígenes configurada fuera del repositorio. En producción no use `*`.
También deben configurarse `NODE_ENV`, `PORT` y las variables de base de datos
requeridas por el backend.

## Configuración del frontend

`VITE_API_URL` se inyecta durante el build. El archivo
`frontend/.env.example` lo deja vacío deliberadamente para no inventar una URL
de Azure.
