import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, las llamadas a /api del frontend se reenvian al backend
    // (Node/Express en http://localhost:3000). Esto evita problemas de CORS y
    // permite que la cookie httpOnly de sesion viaje en el mismo origen.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
