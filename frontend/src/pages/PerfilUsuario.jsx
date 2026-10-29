import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import Metrica from '../components/Metrica.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { consultarSaldo, cuentasNormalizadas } from '../services/saldoService.js';
import { iniciales, fechaHora, moneda, nombreCompleto } from '../utils/formato.js';

/**
 * Perfil del usuario en sesion. Ruta: /perfil
 *
 * Los datos personales provienen del objeto `usuario` que devuelve el login y
 * que el AuthContext conserva en localStorage (no existe endpoint de consulta
 * ni de actualizacion de perfil). El saldo se consulta con GET /api/saldo.
 */
export default function PerfilUsuario() {
  const { usuario, esAdministrador, token } = useAuth();

  const cargar = useCallback(() => consultarSaldo(), []);
  const saldo = usePeticion(cargar, []);

  const cuentas = useMemo(() => cuentasNormalizadas(saldo.datos), [saldo.datos]);

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Mi perfil</h1>
          <p>Datos de la sesion activa y resumen del saldo ficticio asociado a tu usuario.</p>
        </div>
      </header>

      <Alert tipo="info" titulo="Solo lectura">
        La API no expone endpoints para consultar ni actualizar el perfil; los datos que ves
        provienen de la respuesta de <code>POST /api/auth/login</code> conservada en la sesion.
        Si algo esta desactualizado, cierra sesion y vuelve a entrar.
      </Alert>

      <div className="grid grid-2">
        <Card titulo="Datos de la cuenta">
          <div className="fila" style={{ marginBottom: 'var(--esp-4)' }}>
            <span className="navbar__avatar" aria-hidden="true">
              {iniciales(usuario?.nombres, usuario?.apellidos)}
            </span>
            <div>
              <strong>{nombreCompleto(usuario)}</strong>
              <br />
              <span className="texto-pequeno texto-suave">{usuario?.correo}</span>
            </div>
          </div>

          <ul className="lista-simple">
            <li>
              <span className="texto-suave">Identificador</span>
              <span>{usuario?.idUsuario ?? '—'}</span>
            </li>
            <li>
              <span className="texto-suave">Nombres</span>
              <span>{usuario?.nombres || '—'}</span>
            </li>
            <li>
              <span className="texto-suave">Apellidos</span>
              <span>{usuario?.apellidos || '—'}</span>
            </li>
            <li>
              <span className="texto-suave">Correo</span>
              <span>{usuario?.correo || '—'}</span>
            </li>
            <li>
              <span className="texto-suave">Telefono</span>
              <span>{usuario?.telefono || 'no registrado'}</span>
            </li>
            <li>
              <span className="texto-suave">Rol</span>
              <Badge tipo={esAdministrador ? 'primario' : 'info'}>{usuario?.rol}</Badge>
            </li>
            <li>
              <span className="texto-suave">Sesion</span>
              <span className="texto-pequeno">
                {token ? `JWT activo (${token.slice(0, 12)}...)` : 'sin token'}
              </span>
            </li>
          </ul>
        </Card>

        <div className="pila">
          <Card titulo="Saldo asociado" variante="acento">
            {saldo.cargando && <Loader texto="Consultando saldo..." />}

            {!saldo.cargando && (
              <Metrica
                etiqueta="Saldo total"
                valor={moneda(saldo.datos?.saldoTotal ?? 0)}
                detalle={`${cuentas.length} cuenta(s)`}
                tono="exito"
              />
            )}

            {saldo.error && (
              <Alert tipo="error" titulo="No se pudo consultar el saldo">
                {saldo.error.mensaje}
              </Alert>
            )}

            <div className="card__pie">
              <Link to="/saldo">Ver detalle del saldo</Link> ·{' '}
              <Link to="/saldo/movimientos">Movimientos</Link>
            </div>
          </Card>

          <Card titulo="Cuentas por tipo" variante="plana">
            {cuentas.length === 0 && !saldo.cargando && (
              <p className="texto-suave texto-pequeno" style={{ margin: 0 }}>
                Sin cuentas registradas para mostrar.
              </p>
            )}

            {cuentas.length > 0 && (
              <ul className="lista-simple">
                {cuentas.map((cuenta) => (
                  <li key={cuenta.idSaldoCuenta}>
                    <span>
                      <strong>{cuenta.nombreTipoSaldo}</strong>
                      <br />
                      <span className="texto-pequeno texto-suave">
                        Cuenta #{cuenta.idSaldoCuenta} · tipo #{cuenta.idTipoSaldo ?? '—'} ·{' '}
                        {fechaHora(cuenta.fechaUltimaActualizacion)}
                      </span>
                    </span>
                    <span className="monto monto--abono">{moneda(cuenta.saldoActual)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card titulo="Accesos rapidos" variante="plana">
        <div className="fila fila--envuelve">
          <Link className="btn btn--secundario" to="/apuestas">
            Mis apuestas
          </Link>
          <Link className="btn btn--secundario" to="/eventos">
            Eventos activos
          </Link>
          <Link className="btn btn--secundario" to="/notificaciones">
            Notificaciones
          </Link>
          {esAdministrador && (
            <Link className="btn btn--primario" to="/admin">
              Panel administrativo
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
