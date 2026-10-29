import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { iniciarSesion as iniciarSesionApi } from '../services/authService.js';
import { registrarManejadorNoAutorizado } from '../services/api.js';
import {
  guardarToken,
  guardarUsuario,
  limpiarSesion,
  obtenerToken,
  obtenerUsuario,
} from '../utils/almacenamiento.js';
import { ROLES } from '../utils/constantes.js';

/**
 * Contexto de AUTENTICACION.
 *
 * Estado que expone:
 *   usuario           -> { idUsuario, nombres, apellidos, correo, telefono, rol } | null
 *   token             -> string | null
 *   rol               -> 'usuario' | 'administrador' | null
 *   estaAutenticado   -> boolean
 *   esAdministrador   -> boolean
 *   cargando          -> boolean (hidratacion inicial desde localStorage)
 *   error             -> string | null
 *   login(correo, contrasena) -> Promise<usuario>
 *   logout()          -> void
 *   limpiarError()    -> void
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuario());
  const [token, setToken] = useState(() => obtenerToken());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  /** Cierra la sesion en memoria y en localStorage. */
  const logout = useCallback(() => {
    limpiarSesion();
    setUsuario(null);
    setToken(null);
  }, []);

  /** Ante un 401 global (token vencido) el contexto cierra la sesion. */
  useEffect(() => {
    registrarManejadorNoAutorizado(logout);
    return () => registrarManejadorNoAutorizado(null);
  }, [logout]);

  /**
   * Inicia sesion contra POST /api/auth/login y persiste token + usuario.
   * @param {{correo:string, contrasena:string}} credenciales
   */
  const login = useCallback(async ({ correo, contrasena }) => {
    setCargando(true);
    setError(null);
    try {
      const datos = await iniciarSesionApi({ correo, contrasena });
      guardarToken(datos.token);
      guardarUsuario(datos.usuario);
      setToken(datos.token);
      setUsuario(datos.usuario);
      return datos.usuario;
    } catch (excepcion) {
      setError(excepcion);
      throw excepcion;
    } finally {
      setCargando(false);
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  const valor = useMemo(
    () => ({
      usuario,
      token,
      rol: usuario ? usuario.rol : null,
      estaAutenticado: Boolean(token && usuario),
      esAdministrador: Boolean(usuario && usuario.rol === ROLES.administrador),
      cargando,
      error,
      login,
      logout,
      limpiarError,
    }),
    [usuario, token, cargando, error, login, logout, limpiarError],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/** Hook de acceso al contexto. Falla rapido si se usa fuera del proveedor. */
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return contexto;
}

export default AuthContext;
