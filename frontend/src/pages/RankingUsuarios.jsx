import { useCallback, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import Metrica from '../components/Metrica.jsx';
import Pagination from '../components/Pagination.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { usePaginacion } from '../hooks/usePaginacion.js';
import { reporteRanking } from '../services/reporteService.js';
import { moneda, numero } from '../utils/formato.js';

/**
 * Ranking de usuarios. Ruta: /ranking (solo administrador)
 *
 * Endpoint: GET /api/reportes/ranking -> { filas[], total }
 *   filas[]: { posicion, id_usuario, correo, total_apuestas, apuestas_ganadas,
 *              apuestas_perdidas, total_apostado, total_premios, ganancia_neta }
 *
 * La vista vw_RankingUsuarios ordena por ganancia_neta descendente y usa
 * RANK() para la columna `posicion`.
 */
export default function RankingUsuarios() {
  const [limite, setLimite] = useState('50');

  const cargar = useCallback(() => reporteRanking(), []);
  const { datos, cargando, error, recargar } = usePeticion(cargar, []);

  const filas = (datos?.filas || []).slice(0, Number(limite) || 50);
  const paginacion = usePaginacion(filas, 10);

  const mejorGanancia = filas.length
    ? Math.max(...filas.map((fila) => Number(fila.ganancia_neta) || 0))
    : 0;

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Ranking de usuarios</h1>
          <p>
            Clasificacion por ganancia neta (premios menos montos liquidados) calculada en
            vw_RankingUsuarios. Pantalla exclusiva del rol administrador.
          </p>
        </div>
        <button type="button" className="btn btn--secundario" onClick={() => recargar()}>
          Actualizar
        </button>
      </header>

      {error && (
        <Alert tipo="error" titulo="No se pudo consultar el ranking">
          {error.mensaje}
        </Alert>
      )}

      <div className="grid grid-3">
        <Card titulo="Usuarios clasificados">
          <Metrica etiqueta="Total" valor={numero(datos?.total ?? 0)} detalle="Filas de la vista" />
        </Card>
        <Card titulo="Mejor ganancia neta">
          <Metrica
            etiqueta="Lider"
            valor={moneda(mejorGanancia)}
            detalle="Incluye premios y montos liquidados"
            tono="exito"
          />
        </Card>
        <Card titulo="Alcance">
          <Metrica
            etiqueta="Todos los usuarios"
            valor={numero(datos?.total ?? 0)}
            detalle="Ningun limite de rol en la vista"
          />
        </Card>
      </div>

      <Card titulo="Filtro" variante="plana">
        <div className="rejilla-filtros">
          <FormField
            etiqueta="Filas mostradas"
            nombre="limite"
            tipo="select"
            valor={limite}
            onChange={(evento) => setLimite(evento.target.value)}
            opciones={[
              { valor: '10', etiqueta: '10' },
              { valor: '25', etiqueta: '25' },
              { valor: '50', etiqueta: '50' },
              { valor: '100', etiqueta: '100' },
              { valor: '1000', etiqueta: 'Todas' },
            ]}
            ayuda="Filtro aplicado en el cliente: el endpoint de ranking no admite parametros."
          />
        </div>
      </Card>

      <Card titulo="Tabla de posiciones" subtitulo={`${paginacion.total} fila(s)`}>
        <Table
          filas={paginacion.visibles}
          cargando={cargando}
          claveFila={(fila) => fila.id_usuario}
          vacio={{
            titulo: 'Sin datos de ranking',
            mensaje: 'La vista vw_RankingUsuarios no devolvio filas.',
            icono: '🏆',
          }}
          columnas={[
            {
              clave: 'posicion',
              titulo: 'Pos.',
              alineacion: 'der',
              render: (fila) => (
                <Badge tipo={Number(fila.posicion) === 1 ? 'primario' : 'neutro'}>
                  #{fila.posicion}
                </Badge>
              ),
            },
            { clave: 'correo', titulo: 'Usuario' },
            {
              clave: 'total_apuestas',
              titulo: 'Apuestas',
              alineacion: 'der',
              render: (fila) => numero(fila.total_apuestas),
            },
            {
              clave: 'apuestas_ganadas',
              titulo: 'Ganadas',
              alineacion: 'der',
              render: (fila) => <span className="monto monto--abono">{numero(fila.apuestas_ganadas)}</span>,
            },
            {
              clave: 'apuestas_perdidas',
              titulo: 'Perdidas',
              alineacion: 'der',
              render: (fila) => <span className="monto monto--debito">{numero(fila.apuestas_perdidas)}</span>,
            },
            {
              clave: 'total_apostado',
              titulo: 'Apostado',
              alineacion: 'der',
              render: (fila) => moneda(fila.total_apostado),
            },
            {
              clave: 'total_premios',
              titulo: 'Premios',
              alineacion: 'der',
              render: (fila) => moneda(fila.total_premios),
            },
            {
              clave: 'ganancia_neta',
              titulo: 'Ganancia neta',
              alineacion: 'der',
              render: (fila) => (
                <strong
                  className={
                    Number(fila.ganancia_neta) >= 0 ? 'monto monto--abono' : 'monto monto--debito'
                  }
                >
                  {moneda(fila.ganancia_neta)}
                </strong>
              ),
            },
          ]}
        />

        <Pagination
          pagina={paginacion.pagina}
          totalPaginas={paginacion.totalPaginas}
          total={paginacion.total}
          desde={paginacion.desde}
          hasta={paginacion.hasta}
          onCambiar={paginacion.cambiarPagina}
        />
      </Card>
    </div>
  );
}
