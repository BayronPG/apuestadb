import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Guarda de ruta: solo permite entrar si hay sesion activa.
// Mientras el backend confirma la sesion muestra un estado de carga.
export default function RequisitoSesion({ children }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Cargando sesión…
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/" replace />
  }

  return children
}
