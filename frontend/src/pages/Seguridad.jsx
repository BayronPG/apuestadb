import { useCallback, useEffect, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import {
  activar2fa,
  configurar2fa,
  desactivar2fa,
  estado2fa,
} from '../services/authService.js';
import { mensajeDeError } from '../utils/errores.js';

/** Activacion/desactivacion del segundo factor TOTP. Ruta: /seguridad */
export default function Seguridad() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [qr, setQr] = useState(null);
  const [secreto, setSecreto] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setEstado(await estado2fa());
    } catch (excepcion) {
      setError(mensajeDeError(excepcion));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const iniciarActivacion = async () => {
    setError(null);
    setOk(null);
    try {
      const datos = await configurar2fa();
      setQr(datos.qr);
      setSecreto(datos.secreto);
      setCodigo('');
    } catch (excepcion) {
      setError(mensajeDeError(excepcion));
    }
  };

  const confirmarActivacion = async (evento) => {
    evento.preventDefault();
    setError(null);
    setOk(null);
    try {
      await activar2fa({ codigo });
      setQr(null);
      setSecreto(null);
      setCodigo('');
      setOk('2FA activado. La proxima vez se pedira el codigo al iniciar sesion.');
      await cargar();
    } catch (excepcion) {
      setError(mensajeDeError(excepcion));
    }
  };

  const confirmarDesactivacion = async (evento) => {
    evento.preventDefault();
    setError(null);
    setOk(null);
    try {
      await desactivar2fa({ contrasena, codigo });
      setContrasena('');
      setCodigo('');
      setOk('2FA desactivado.');
      await cargar();
    } catch (excepcion) {
      setError(mensajeDeError(excepcion));
    }
  };

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Seguridad</h1>
          <p>Segundo factor con Google Authenticator o Microsoft Authenticator.</p>
        </div>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudo completar la operacion" onCerrar={() => setError(null)}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert tipo="exito" titulo="Listo" onCerrar={() => setOk(null)}>
          {ok}
        </Alert>
      )}

      <Card titulo="Autenticacion en dos pasos (TOTP)">
        {cargando ? (
          <Loader texto="Consultando estado..." />
        ) : estado?.habilitado ? (
          <div className="pila">
            <p className="texto-suave texto-pequeno">
              2FA esta activo desde {estado.fechaActivacion ? new Date(estado.fechaActivacion).toLocaleString('es-CO') : 'la activacion'}.
            </p>
            <form onSubmit={confirmarDesactivacion} className="pila">
              <FormField
                etiqueta="Contrasena actual"
                nombre="contrasena2fa"
                tipo="password"
                valor={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                requerido
                autoComplete="current-password"
              />
              <FormField
                etiqueta="Codigo 2FA"
                nombre="codigoDesactivar"
                tipo="text"
                valor={codigo}
                onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, '').slice(0, 6))}
                requerido
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
              />
              <button type="submit" className="btn btn--peligro btn--sm">
                Desactivar 2FA
              </button>
            </form>
          </div>
        ) : qr ? (
          <form onSubmit={confirmarActivacion} className="pila">
            <p className="texto-pequeno texto-suave">
              Escanea el QR con Google Authenticator o Microsoft Authenticator y confirma el codigo.
            </p>
            <img src={qr} alt="Codigo QR para configurar 2FA" width="240" height="240" />
            <p className="texto-pequeno">
              Clave manual: <code>{secreto}</code>
            </p>
            <FormField
              etiqueta="Codigo de 6 digitos"
              nombre="codigoActivar"
              tipo="text"
              valor={codigo}
              onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, '').slice(0, 6))}
              requerido
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
            />
            <button type="submit" className="btn btn--primario btn--sm" disabled={codigo.length !== 6}>
              Confirmar y activar
            </button>
          </form>
        ) : (
          <div className="pila">
            <p className="texto-suave texto-pequeno">
              Al activarlo, el login pedira un codigo temporal despues de la contrasena y tambien
              despues de Google.
            </p>
            <button type="button" className="btn btn--primario btn--sm" onClick={iniciarActivacion}>
              Activar 2FA
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
