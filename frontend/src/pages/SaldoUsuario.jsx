import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import Metrica from '../components/Metrica.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import {
  consultarSaldo,
  consultarPagosWompi,
  consultarHistorialFirestore,
  crearCheckoutWompi,
  cuentasNormalizadas,
} from '../services/saldoService.js';
import { obtenerTokenRecaptcha, recaptchaConfigurado } from '../utils/recaptcha.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fechaHora, moneda } from '../utils/formato.js';
import { normalizarError } from '../utils/errores.js';

/**
 * Saldo del usuario. Ruta: /saldo
 *
 * Endpoint: GET /api/saldo -> { cuentas[], saldoTotal }
 *   cuentas[] (contrato Fase 10.1, camelCase): { idSaldoCuenta, idTipoSaldo,
 *   nombreTipoSaldo, saldoActual, fechaUltimaActualizacion }
 *   La API conserva ademas las claves snake_case por compatibilidad; la pantalla
 *   usa la forma camelCase e incluye el id del tipo de saldo.
 *
 * Las recargas son una operacion exclusiva del administrador
 * (POST /api/recargas), por eso aqui solo se informa.
 */
export default function SaldoUsuario() {
  const { esAdministrador } = useAuth();
  const cargar = useCallback(() => consultarSaldo(), []);
  const { datos, cargando, error, recargar } = usePeticion(cargar, []);

  const cuentas = useMemo(() => cuentasNormalizadas(datos), [datos]);
  const [montoWompi, setMontoWompi] = useState(10000);
  const [enviandoWompi, setEnviandoWompi] = useState(false);
  const [errorWompi, setErrorWompi] = useState(null);
  const [filtroPagos, setFiltroPagos] = useState('TODAS');
  const cargarPagos = useCallback(() => consultarPagosWompi(), []);
  const { datos: datosPagos, cargando: cargandoPagos } = usePeticion(cargarPagos, []);
  const cargarFirestore = useCallback(() => consultarHistorialFirestore(), []);
  const { datos: datosFirestore, cargando: cargandoFirestore, error: errorFirestore } = usePeticion(cargarFirestore, []);
  const cuentaWompi = cuentas.find((cuenta) => cuenta.idTipoSaldo !== null) || null;

  const pagos = useMemo(() => datosPagos?.pagos || [], [datosPagos]);
  const pagosFiltrados = useMemo(
    () => (filtroPagos === 'TODAS' ? pagos : pagos.filter((pago) => pago.estado === filtroPagos)),
    [pagos, filtroPagos],
  );
  const tonoEstado = { APROBADO: 'exito', PENDIENTE: 'advertencia', RECHAZADO: 'error' };

  const recargarConWompi = async () => {
    setErrorWompi(null);
    if (!cuentaWompi) {
      setErrorWompi('No hay una cuenta de saldo disponible para aplicar la recarga.');
      return;
    }
    setEnviandoWompi(true);
    try {
      const recaptchaToken = await obtenerTokenRecaptcha('recarga');
      if (recaptchaConfigurado && !recaptchaToken) {
        setErrorWompi('No fue posible validar reCAPTCHA. Intenta de nuevo en unos segundos.');
        return;
      }
      const datosCheckout = await crearCheckoutWompi({
        idTipoSaldo: cuentaWompi.idTipoSaldo,
        monto: Number(montoWompi),
        recaptchaToken,
      });
      window.location.assign(datosCheckout.checkoutUrl);
    } catch (excepcion) {
      setErrorWompi(normalizarError(excepcion).mensaje);
    } finally {
      setEnviandoWompi(false);
    }
  };

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Mi saldo</h1>
          <p>
            Saldo ficticio por tipo (tokens y PSE). El id del usuario se toma del token: la
            pantalla nunca lo envia.
          </p>
        </div>
        <button type="button" className="btn btn--secundario" onClick={() => recargar()}>
          Actualizar
        </button>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudo consultar el saldo" onCerrar={() => recargar()}>
          {error.mensaje}
        </Alert>
      )}

      <div className="grid grid-2">
        <Card titulo="Saldo consolidado" variante="acento">
          {cargando ? (
            <Loader texto="Consultando saldo..." />
          ) : (
            <Metrica
              etiqueta="Total"
              valor={moneda(datos?.saldoTotal ?? 0)}
              detalle={`${cuentas.length} cuenta(s) registradas`}
              tono="exito"
            />
          )}
        </Card>

        <Card titulo="Como se alimenta el saldo" subtitulo="Operacion de administrador">
          <ul className="texto-pequeno texto-suave" style={{ paddingLeft: 'var(--esp-5)' }}>
            <li>
              Las recargas ficticias se aplican con POST /api/recargas (rol administrador), usando
              el tipo de saldo (idTipoSaldo) que devuelve este endpoint.
            </li>
            <li>Al registrar una apuesta se descuenta el saldo del tipo seleccionado.</li>
            <li>Al liquidar una apuesta ganada se abona el premio calculado con la cuota congelada.</li>
          </ul>
          {esAdministrador && (
            <Link className="btn btn--primario btn--sm" to="/admin">
              Ir al panel administrativo
            </Link>
          )}
        </Card>

        <Card titulo="Recargar con Wompi Sandbox" subtitulo="Pago simulado - sin dinero real">
          <p className="texto-pequeno texto-suave">
            Se crea un pago pendiente en PagoWompi y se abre el checkout real de Wompi Sandbox
            con el tipo de saldo de tu cuenta.
          </p>
          {errorWompi && (
            <Alert tipo="error" titulo="No se pudo iniciar la recarga" onCerrar={() => setErrorWompi(null)}>
              {errorWompi}
            </Alert>
          )}
          <label className="campo">
            <span className="campo__etiqueta">Monto (COP)</span>
            <select
              className="campo__control"
              value={montoWompi}
              onChange={(evento) => setMontoWompi(Number(evento.target.value))}
            >
              <option value={10000}>$10.000</option>
              <option value={20000}>$20.000</option>
              <option value={50000}>$50.000</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn--primario btn--sm"
            onClick={recargarConWompi}
            disabled={enviandoWompi || !cuentaWompi}
          >
            {enviandoWompi ? 'Creando pago...' : 'Ir a Wompi Sandbox'}
          </button>
          {!cuentaWompi && (
            <p className="texto-pequeno texto-suave">Necesitas una cuenta de saldo para recargar.</p>
          )}
        </Card>
      </div>

      <Card
        titulo="Cuentas por tipo de saldo"
        subtitulo="GET /api/saldo (incluye idTipoSaldo y nombreTipoSaldo)"
      >
        <Table
          filas={cuentas}
          cargando={cargando}
          claveFila={(fila) => fila.idSaldoCuenta}
          vacio={{
            titulo: 'Sin cuentas de saldo',
            mensaje: 'El usuario no tiene cuentas registradas para mostrar.',
            icono: '💰',
          }}
          columnas={[
            { clave: 'idSaldoCuenta', titulo: 'Cuenta', alineacion: 'der' },
            {
              clave: 'idTipoSaldo',
              titulo: 'Tipo (id)',
              alineacion: 'der',
              render: (fila) => (fila.idTipoSaldo === null ? '—' : fila.idTipoSaldo),
            },
            {
              clave: 'nombreTipoSaldo',
              titulo: 'Tipo de saldo',
              render: (fila) => <Badge tipo="info">{fila.nombreTipoSaldo || '—'}</Badge>,
            },
            {
              clave: 'saldoActual',
              titulo: 'Saldo actual',
              alineacion: 'der',
              render: (fila) => (
                <strong className="monto monto--abono">{moneda(fila.saldoActual)}</strong>
              ),
            },
            {
              clave: 'fechaUltimaActualizacion',
              titulo: 'Ultima actualizacion',
              render: (fila) => fechaHora(fila.fechaUltimaActualizacion),
            },
          ]}
        />

        {!cargando && cuentas.length === 0 && !error && (
          <EmptyState
            icono="🧾"
            titulo="Cuentas no disponibles"
            mensaje="Si el usuario se creo con usp_Usuario_Registrar, las cuentas se generan en cero; verifica la base de datos."
          />
        )}

        <div className="card__pie">
          <Link to="/saldo/movimientos">Ver historial de movimientos</Link>
        </div>
      </Card>

      <Card
        titulo="Transacciones Wompi"
        subtitulo="Historial de pagos: aprobados, pendientes y rechazados"
      >
        <div className="fila" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['TODAS', 'APROBADO', 'PENDIENTE', 'RECHAZADO'].map((estado) => (
            <button
              key={estado}
              type="button"
              className={`btn btn--sm ${filtroPagos === estado ? 'btn--primario' : 'btn--fantasma'}`}
              onClick={() => setFiltroPagos(estado)}
            >
              {estado === 'TODAS' ? 'Todas' : estado}
            </button>
          ))}
        </div>
        <Table
          filas={pagosFiltrados}
          cargando={cargandoPagos}
          claveFila={(fila) => fila.referencia}
          vacio={{
            titulo: 'Sin transacciones',
            mensaje: 'Aun no hay pagos Wompi para este usuario.',
            icono: '💳',
          }}
          columnas={[
            { clave: 'creado', titulo: 'Fecha', render: (fila) => fechaHora(fila.creado) },
            {
              clave: 'monto',
              titulo: 'Monto',
              alineacion: 'der',
              render: (fila) => <strong>{moneda(fila.monto)}</strong>,
            },
            {
              clave: 'estado',
              titulo: 'Estado',
              render: (fila) => (
                <Badge tipo={tonoEstado[fila.estado] || 'neutro'}>{fila.estado}</Badge>
              ),
            },
            { clave: 'referencia', titulo: 'Referencia' },
          ]}
        />
      </Card>

      <Card
        titulo="Historial Firestore"
        subtitulo="Espejo de transacciones (PostgreSQL sigue siendo la fuente de verdad)"
      >
        {errorFirestore && (
          <p className="texto-pequeno texto-suave">No se pudo consultar Firestore.</p>
        )}
        {!errorFirestore && datosFirestore && datosFirestore.habilitado === false && (
          <p className="texto-pequeno texto-suave">
            Firestore no está configurado en este entorno.
          </p>
        )}
        {!errorFirestore && datosFirestore?.habilitado !== false && (
          <Table
            filas={datosFirestore?.transacciones || []}
            cargando={cargandoFirestore}
            claveFila={(fila) => fila.referencia}
            vacio={{
              titulo: 'Sin transacciones en Firestore',
              mensaje: 'Aún no se ha replicado ningún pago.',
              icono: '🔥',
            }}
            columnas={[
              { clave: 'fecha', titulo: 'Fecha', render: (fila) => fechaHora(fila.fecha) },
              {
                clave: 'monto',
                titulo: 'Monto',
                alineacion: 'der',
                render: (fila) => <strong>{moneda(fila.monto)}</strong>,
              },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (fila) => (
                  <Badge tipo={tonoEstado[fila.estado] || 'neutro'}>{fila.estado}</Badge>
                ),
              },
              { clave: 'referencia', titulo: 'Referencia' },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
