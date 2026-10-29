import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { mensajeDeError } from '../utils/errores.js';
import { validarLogin, sinErrores } from '../utils/validaciones.js';
import { ROLES } from '../utils/constantes.js';

/**
 * Pantalla de inicio de sesion  ->  POST /api/auth/login
 * Ruta: /login
 *
 * Respuesta usada: { token, expiraEn, usuario: { idUsuario, nombres, apellidos,
 * correo, telefono, rol } }. El AuthContext guarda token y usuario en
 * localStorage y expone `usuario` y `rol`.
 */
export default function Login() {
  const { login, estaAutenticado, esAdministrador } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [correo, setCorreo] = useState(ubicacion.state?.correo || '');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (estaAutenticado) {
    const destino = ubicacion.state?.desde || (esAdministrador ? '/admin' : '/dashboard');
    return <Navigate to={destino} replace />;
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    const encontrados = validarLogin({ correo, contrasena });
    setErrores(encontrados);
    setErrorServidor(null);
    if (!sinErrores(encontrados)) return;

    setEnviando(true);
    try {
      const usuario = await login({ correo, contrasena });
      const destino =
        ubicacion.state?.desde ||
        (usuario.rol === ROLES.administrador ? '/admin' : '/dashboard');
      navegar(destino, { replace: true });
    } catch (excepcion) {
      setErrorServidor(mensajeDeError(excepcion));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <h1 style={{ fontSize: 'var(--fs-xl)' }}>Iniciar sesion</h1>
      <p className="texto-suave texto-pequeno">
        Ingrese con su correo y contrasena registrados. El saldo es ficticio.
      </p>

      {ubicacion.state?.registrado && (
        <Alert tipo="exito" titulo="Registro exitoso">
          Tu cuenta fue creada. Inicia sesion con tus credenciales.
        </Alert>
      )}

      {ubicacion.state?.restablecido && (
        <Alert tipo="exito" titulo="Contrasena actualizada">
          Ya puedes iniciar sesion con tu nueva contrasena.
        </Alert>
      )}

      {errorServidor && (
        <Alert tipo="error" titulo="No fue posible iniciar sesion" onCerrar={() => setErrorServidor(null)}>
          {errorServidor}
        </Alert>
      )}

      <FormField
        etiqueta="Correo"
        nombre="correo"
        tipo="email"
        valor={correo}
        onChange={(evento) => setCorreo(evento.target.value)}
        error={errores.correo}
        requerido
        autoComplete="email"
        placeholder="usuario@ejemplo.com"
        deshabilitado={enviando}
      />

      <FormField
        etiqueta="Contrasena"
        nombre="contrasena"
        tipo="password"
        valor={contrasena}
        onChange={(evento) => setContrasena(evento.target.value)}
        error={errores.contrasena}
        requerido
        autoComplete="current-password"
        placeholder="••••••••"
        deshabilitado={enviando}
      />

      <button type="submit" className="btn btn--primario btn--bloque" disabled={enviando}>
        {enviando ? <Loader tamano="sm" texto="Validando..." /> : 'Entrar'}
      </button>

      <p className="texto-pequeno centrado" style={{ marginTop: 'var(--esp-4)' }}>
        <Link to="/recuperar">Olvide mi contrasena</Link>
      </p>

      <p className="texto-pequeno texto-suave centrado">
        No tengo cuenta: <Link to="/registro">registrarme</Link>
      </p>
    </form>
  );
}
