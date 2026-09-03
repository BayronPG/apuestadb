import { createContext, useContext, useCallback, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Consulta al backend si existe una sesion activa (cookie httpOnly).
  const refrescar = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/sesion')
      if (r.ok) {
        const d = await r.json()
        setUsuario(d.usuario)
        return d.usuario
      }
      setUsuario(null)
      return null
    } catch {
      setUsuario(null)
      return null
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    refrescar()
  }, [refrescar])

  const cerrarSesion = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Aun sin respuesta del servidor, la sesion local se limpia.
    }
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, cargando, refrescar, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
