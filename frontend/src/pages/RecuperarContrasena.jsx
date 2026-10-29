import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import { solicitarRecuperacion, restablecerContrasena } from '../services/authService.js';
import { mensajeDeError } from '../utils/errores.js';
import {
  validarSolicitudRecuperacion,
  validarRestablecimiento,
  sinErrores,
} from '../utils/validaciones.js';

/**
 * Recuperacion de contrasena en dos pasos.
 * Ruta: /recuperar
 *
 *   Paso 1 -> POST /api/auth/recuperar   { correo }        -> { valorToken, mensaje }
 *   Paso 2 -> POST /api/auth/restablecer { correo, valorToken, nuevaContrasena } -> { mensaje }
 *
 * Supuesto academico declarado en docs/backend/ENDPOINTS.md: la API devuelve el
 * token en la respuesta porque el proyecto no tiene servidor de correo. Aqui se
 * muestra al usuario con la advertencia de que en produccion llegaria por correo.
 */
export default function RecuperarContrasena() {
  const navegar = useNavigate();

  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [valorToken, setValorToken] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensajeToken, setMensajeToken] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [cargando, setCargando] = useState(false);

  const solicitar = async (evento) => {
    evento.preventDefault();
    const encontrados = validarSolicitudRecuperacion({ correo });
    setErrores(encontrados);
    setErrorServidor(null);
    if (!sinErrores(encontrados)) return;

    setCargando(true);
    try {
      const datos = await solicitarRecuperacion({ correo: correo.trim() });
      setValorToken(datos.valorToken || '');
      setMensajeToken(datos.mensaje);
      setPaso(2);
    } catch (excepcion) {
      setErrorServidor(mensajeDeError(excepcion));
    } finally {
      setCargando(false);
    }
  };

  const restablecer = async (evento) => {
    evento.preventDefault();
    const encontrados = validarRestablecimiento({ correo, valorToken, nuevaContrasena, confirmacion });
    setErrores(encontrados);
    setErrorServidor(null);
    if (!sinErrores(encontrados)) return;

    setCargando(true);
    try {
      await restablecerContrasena({
        correo: correo.trim(),
        valorToken: valorToken.trim(),
        nuevaContrasena,
      });
      navegar('/login', { replace: true, state: { restablecido: true, correo } });
    } catch (excepcion) {
      setErrorServidor(mensajeDeError(excepcion));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 'var(--fs-xl)' }}>Recuperar contrasena</h1>
      <p className="texto-suave texto-pequeno">
        {paso === 1
          ? 'Indica tu correo para generar un token de recuperacion.'
          : 'Ingresa el token generado y define la nueva contrasena.'}
      </p>

      {errorServidor && (
        <Alert tipo="error" titulo="No fue posible completar la operacion" onCerrar={() => setErrorServidor(null)}>
          {errorServidor}
        </Alert>
      )}

      {paso === 1 && (
        <form onSubmit={solicitar} noValidate>
          <FormField
            etiqueta="Correo registrado"
            nombre="correo"
            tipo="email"
            valor={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            error={errores.correo}
            requerido
            autoComplete="email"
            deshabilitado={cargando}
          />

          <button type="submit" className="btn btn--primario btn--bloque" disabled={cargando}>
            {cargando ? <Loader tamano="sm" texto="Generando token..." /> : 'Generar token'}
          </button>

          <p className="texto-pequeno centrado" style={{ marginTop: 'var(--esp-4)' }}>
            <Link to="/login">Volver al inicio de sesion</Link>
          </p>
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={restablecer} noValidate>
          {mensajeToken && (
            <Alert tipo="info" titulo="Token de recuperacion">
              {mensajeToken}
            </Alert>
          )}

          <Alert tipo="advertencia" titulo="Supuesto academico">
            El token se muestra aqui porque la API no envia correos. Vigencia: 30 minutos.
          </Alert>

          <FormField
            etiqueta="Correo"
            nombre="correo"
            tipo="email"
            valor={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            error={errores.correo}
            requerido
            deshabilitado={cargando}
          />

          <FormField
            etiqueta="Token"
            nombre="valorToken"
            valor={valorToken}
            onChange={(evento) => setValorToken(evento.target.value)}
            error={errores.valorToken}
            requerido
            maxLength={128}
            ayuda="Se llena automaticamente con el token generado en el paso 1."
            deshabilitado={cargando}
          />

          <FormField
            etiqueta="Nueva contrasena"
            nombre="nuevaContrasena"
            tipo="password"
            valor={nuevaContrasena}
            onChange={(evento) => setNuevaContrasena(evento.target.value)}
            error={errores.nuevaContrasena}
            requerido
            autoComplete="new-password"
            ayuda="Entre 8 y 72 caracteres."
            deshabilitado={cargando}
          />

          <FormField
            etiqueta="Confirmar nueva contrasena"
            nombre="confirmacion"
            tipo="password"
            valor={confirmacion}
            onChange={(evento) => setConfirmacion(evento.target.value)}
            error={errores.confirmacion}
            requerido
            autoComplete="new-password"
            deshabilitado={cargando}
          />

          <button type="submit" className="btn btn--primario btn--bloque" disabled={cargando}>
            {cargando ? <Loader tamano="sm" texto="Restableciendo..." /> : 'Restablecer contrasena'}
          </button>

          <p className="texto-pequeno centrado" style={{ marginTop: 'var(--esp-4)' }}>
            <button
              type="button"
              className="btn btn--fantasma btn--sm"
              onClick={() => {
                setPaso(1);
                setErrorServidor(null);
                setErrores({});
              }}
            >
              Usar otro correo
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
