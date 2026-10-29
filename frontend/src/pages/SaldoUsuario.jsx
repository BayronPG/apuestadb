import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import Metrica from '../components/Metrica.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { consultarSaldo, cuentasNormalizadas } from '../services/saldoService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fechaHora, moneda } from '../utils/formato.js';

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
    </div>
  );
}
