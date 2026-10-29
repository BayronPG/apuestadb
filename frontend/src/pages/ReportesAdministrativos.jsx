import { useCallback, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import Table from '../components/Table.jsx';
import { usePeticion } from '../hooks/usePeticion.js';
import { usePaginacion } from '../hooks/usePaginacion.js';
import {
  reporteAdministrativo,
  reporteFinanciero,
  reporteRanking,
} from '../services/reporteService.js';
import { consultarAuditoria, listarUsuarios } from '../services/adminService.js';
import { fechaHora, moneda, numero, textoEstado, tipoBadgeEstado } from '../utils/formato.js';
import { ESTADOS_USUARIO, OPERACIONES_AUDITORIA } from '../utils/constantes.js';

/**
 * Reportes administrativos. Ruta: /admin/reportes (solo administrador)
 *
 * Endpoints consumidos:
 *   GET /api/reportes/administrativo -> { filas, total }  (vw_ReporteAdministrativo)
 *   GET /api/reportes/financiero     -> { filas, total }  (vw_ReporteFinanciero)
 *   GET /api/reportes/ranking        -> { filas, total }  (vw_RankingUsuarios)
 *   GET /api/auditoria               -> { registros, total }
 *   GET /api/usuarios                -> { usuarios, total }
 *
 * Cada pestana conserva su propio estado de carga y error.
 */
export default function ReportesAdministrativos() {
  const [pestana, setPestana] = useState('administrativo');

  const cargarAdministrativo = useCallback(() => reporteAdministrativo(), []);
  const cargarFinanciero = useCallback(() => reporteFinanciero(), []);
  const cargarRanking = useCallback(() => reporteRanking(), []);

  const administrativo = usePeticion(cargarAdministrativo, []);
  const financiero = usePeticion(cargarFinanciero, []);
  const ranking = usePeticion(cargarRanking, []);

  // ------------------------------------------------------------- auditoria --
  const [filtrosAuditoria, setFiltrosAuditoria] = useState({ operacion: '', top: '100' });
  const cargarAuditoria = useCallback(
    () =>
      consultarAuditoria({
        operacion: filtrosAuditoria.operacion || undefined,
        top: Number(filtrosAuditoria.top) || 100,
      }),
    [filtrosAuditoria.operacion, filtrosAuditoria.top],
  );
  const auditoria = usePeticion(cargarAuditoria, [filtrosAuditoria.operacion, filtrosAuditoria.top], {
    inmediato: false,
  });

  // --------------------------------------------------------------- usuarios --
  const [filtrosUsuarios, setFiltrosUsuarios] = useState({ estado: '', rol: '' });
  const cargarUsuarios = useCallback(
    () =>
      listarUsuarios({
        estado: filtrosUsuarios.estado || undefined,
        rol: filtrosUsuarios.rol || undefined,
        limite: 200,
      }),
    [filtrosUsuarios.estado, filtrosUsuarios.rol],
  );
  const usuarios = usePeticion(cargarUsuarios, [filtrosUsuarios.estado, filtrosUsuarios.rol], {
    inmediato: false,
  });

  const alCambiarPestana = (valor) => {
    setPestana(valor);
    if (valor === 'auditoria' && !auditoria.datos && !auditoria.cargando) auditoria.recargar();
    if (valor === 'usuarios' && !usuarios.datos && !usuarios.cargando) usuarios.recargar();
  };

  const paginacionAdministrativo = usePaginacion(administrativo.datos?.filas || [], 10);
  const paginacionFinanciero = usePaginacion(financiero.datos?.filas || [], 10);
  const paginacionRanking = usePaginacion(ranking.datos?.filas || [], 10);
  const paginacionAuditoria = usePaginacion(auditoria.datos?.registros || [], 15);
  const paginacionUsuarios = usePaginacion(usuarios.datos?.usuarios || [], 10);

  const PESTANAS = [
    { clave: 'administrativo', etiqueta: 'Administrativo' },
    { clave: 'financiero', etiqueta: 'Financiero' },
    { clave: 'ranking', etiqueta: 'Ranking' },
    { clave: 'auditoria', etiqueta: 'Auditoria' },
    { clave: 'usuarios', etiqueta: 'Usuarios' },
  ];

  return (
    <div className="pila">
      <header className="pagina__cabecera">
        <div>
          <h1>Reportes administrativos</h1>
          <p>
            Consultas de solo lectura sobre las vistas de reportes y la auditoria registrada por
            los procedimientos de la base ApuestaDB.
          </p>
        </div>
      </header>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((item) => (
          <button
            key={item.clave}
            type="button"
            role="tab"
            aria-selected={pestana === item.clave}
            className={pestana === item.clave ? 'pestana pestana--activa' : 'pestana'}
            onClick={() => alCambiarPestana(item.clave)}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------ administrativo */}
      {pestana === 'administrativo' && (
        <Card
          titulo="Reporte administrativo por evento"
          subtitulo={`vw_ReporteAdministrativo · ${paginacionAdministrativo.total} fila(s)`}
          acciones={administrativo.cargando ? <Loader tamano="sm" texto="Cargando..." /> : null}
        >
          {administrativo.error && (
            <Alert tipo="error" titulo="No se pudo consultar el reporte">
              {administrativo.error.mensaje}
            </Alert>
          )}

          <Table
            filas={paginacionAdministrativo.visibles}
            cargando={administrativo.cargando}
            claveFila={(fila) => fila.id_evento}
            vacio={{
              titulo: 'Sin filas',
              mensaje: 'La vista no devolvio informacion.',
              icono: '📊',
            }}
            columnas={[
              { clave: 'id_evento', titulo: '#', alineacion: 'der' },
              {
                clave: 'evento',
                titulo: 'Evento',
                render: (fila) => (
                  <span>
                    {fila.equipo_local} vs {fila.equipo_visitante}
                    <br />
                    <span className="texto-pequeno texto-suave">
                      {fila.deporte} · {fila.liga}
                    </span>
                  </span>
                ),
              },
              {
                clave: 'fecha_hora_inicio',
                titulo: 'Inicio',
                render: (fila) => fechaHora(fila.fecha_hora_inicio),
              },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (fila) => (
                  <Badge tipo={tipoBadgeEstado(fila.estado)}>{textoEstado(fila.estado)}</Badge>
                ),
              },
              {
                clave: 'marcador',
                titulo: 'Marcador',
                alineacion: 'der',
                render: (fila) =>
                  fila.marcador_local === null || fila.marcador_local === undefined
                    ? '—'
                    : `${fila.marcador_local} - ${fila.marcador_visitante}`,
              },
              {
                clave: 'apuestas',
                titulo: 'Apuestas',
                alineacion: 'der',
                render: (fila) => numero(fila.apuestas),
              },
              {
                clave: 'monto_apostado',
                titulo: 'Apostado',
                alineacion: 'der',
                render: (fila) => moneda(fila.monto_apostado),
              },
              {
                clave: 'premios_pagados',
                titulo: 'Premios',
                alineacion: 'der',
                render: (fila) => moneda(fila.premios_pagados),
              },
              {
                clave: 'margen',
                titulo: 'Margen',
                alineacion: 'der',
                render: (fila) => (
                  <strong className={Number(fila.margen) >= 0 ? 'monto monto--abono' : 'monto monto--debito'}>
                    {moneda(fila.margen)}
                  </strong>
                ),
              },
            ]}
          />

          <Pagination
            pagina={paginacionAdministrativo.pagina}
            totalPaginas={paginacionAdministrativo.totalPaginas}
            total={paginacionAdministrativo.total}
            desde={paginacionAdministrativo.desde}
            hasta={paginacionAdministrativo.hasta}
            onCambiar={paginacionAdministrativo.cambiarPagina}
          />
        </Card>
      )}

      {/* ---------------------------------------------------------- financiero */}
      {pestana === 'financiero' && (
        <Card
          titulo="Reporte financiero por tipo de saldo"
          subtitulo={`vw_ReporteFinanciero · ${paginacionFinanciero.total} fila(s)`}
        >
          {financiero.error && (
            <Alert tipo="error" titulo="No se pudo consultar el reporte">
              {financiero.error.mensaje}
            </Alert>
          )}

          <Table
            filas={paginacionFinanciero.visibles}
            cargando={financiero.cargando}
            claveFila={(fila) => fila.id_tipo_saldo}
            vacio={{ titulo: 'Sin filas', mensaje: 'La vista no devolvio informacion.', icono: '💵' }}
            columnas={[
              { clave: 'id_tipo_saldo', titulo: '#', alineacion: 'der' },
              {
                clave: 'tipo_saldo',
                titulo: 'Tipo de saldo',
                render: (fila) => <Badge tipo="info">{fila.tipo_saldo}</Badge>,
              },
              {
                clave: 'total_recargado',
                titulo: 'Recargado',
                alineacion: 'der',
                render: (fila) => moneda(fila.total_recargado),
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
                clave: 'saldo_en_cuentas',
                titulo: 'Saldo en cuentas',
                alineacion: 'der',
                render: (fila) => <strong>{moneda(fila.saldo_en_cuentas)}</strong>,
              },
            ]}
          />
        </Card>
      )}

      {/* ------------------------------------------------------------- ranking */}
      {pestana === 'ranking' && (
        <Card
          titulo="Ranking de usuarios"
          subtitulo={`vw_RankingUsuarios · ${paginacionRanking.total} fila(s)`}
        >
          {ranking.error && (
            <Alert tipo="error" titulo="No se pudo consultar el reporte">
              {ranking.error.mensaje}
            </Alert>
          )}

          <Table
            filas={paginacionRanking.visibles}
            cargando={ranking.cargando}
            claveFila={(fila) => fila.id_usuario}
            vacio={{ titulo: 'Sin filas', mensaje: 'La vista no devolvio informacion.', icono: '🏆' }}
            columnas={[
              {
                clave: 'posicion',
                titulo: 'Pos.',
                alineacion: 'der',
                render: (fila) => <Badge tipo={Number(fila.posicion) === 1 ? 'primario' : 'neutro'}>#{fila.posicion}</Badge>,
              },
              { clave: 'correo', titulo: 'Usuario' },
              {
                clave: 'total_apuestas',
                titulo: 'Apuestas',
                alineacion: 'der',
                render: (fila) => numero(fila.total_apuestas),
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
                  <strong className={Number(fila.ganancia_neta) >= 0 ? 'monto monto--abono' : 'monto monto--debito'}>
                    {moneda(fila.ganancia_neta)}
                  </strong>
                ),
              },
            ]}
          />

          <Pagination
            pagina={paginacionRanking.pagina}
            totalPaginas={paginacionRanking.totalPaginas}
            total={paginacionRanking.total}
            desde={paginacionRanking.desde}
            hasta={paginacionRanking.hasta}
            onCambiar={paginacionRanking.cambiarPagina}
          />
        </Card>
      )}

      {/* ----------------------------------------------------------- auditoria */}
      {pestana === 'auditoria' && (
        <>
          <Card titulo="Filtros de auditoria" subtitulo="GET /api/auditoria">
            <div className="rejilla-filtros">
              <FormField
                etiqueta="Operacion"
                nombre="operacionAuditoria"
                tipo="select"
                valor={filtrosAuditoria.operacion}
                onChange={(evento) =>
                  setFiltrosAuditoria((anterior) => ({ ...anterior, operacion: evento.target.value }))
                }
                opciones={OPERACIONES_AUDITORIA.map((valor) => ({ valor, etiqueta: valor }))}
                placeholder="Todas las operaciones"
              />
              <FormField
                etiqueta="Registros (top)"
                nombre="topAuditoria"
                tipo="select"
                valor={filtrosAuditoria.top}
                onChange={(evento) =>
                  setFiltrosAuditoria((anterior) => ({ ...anterior, top: evento.target.value }))
                }
                opciones={[
                  { valor: '50', etiqueta: '50' },
                  { valor: '100', etiqueta: '100' },
                  { valor: '500', etiqueta: '500' },
                  { valor: '1000', etiqueta: '1000 (maximo)' },
                ]}
                ayuda="El procedimiento normaliza top a 100 por defecto y 1000 como maximo."
              />
              <div className="fila">
                <button type="button" className="btn btn--secundario" onClick={() => auditoria.recargar()}>
                  Aplicar
                </button>
              </div>
            </div>
          </Card>

          <Card titulo="Registros de auditoria" subtitulo={`${paginacionAuditoria.total} registro(s)`}>
            {auditoria.error && (
              <Alert tipo="error" titulo="No se pudo consultar la auditoria">
                {auditoria.error.mensaje}
              </Alert>
            )}

            <Table
              filas={paginacionAuditoria.visibles}
              cargando={auditoria.cargando}
              claveFila={(fila) => fila.id_auditoria}
              vacio={{
                titulo: 'Sin registros',
                mensaje: 'Usa el boton Aplicar para cargar la auditoria con los filtros elegidos.',
                icono: '🧾',
              }}
              columnas={[
                { clave: 'id_auditoria', titulo: '#', alineacion: 'der' },
                { clave: 'fecha_hora', titulo: 'Fecha', render: (fila) => fechaHora(fila.fecha_hora) },
                { clave: 'correo', titulo: 'Usuario', render: (fila) => fila.correo || '—' },
                { clave: 'operacion', titulo: 'Operacion' },
                { clave: 'entidad_afectada', titulo: 'Entidad' },
                {
                  clave: 'resultado',
                  titulo: 'Resultado',
                  render: (fila) => (
                    <Badge tipo={fila.resultado === 'exito' ? 'exito' : 'error'}>
                      {textoEstado(fila.resultado)}
                    </Badge>
                  ),
                },
                {
                  clave: 'descripcion',
                  titulo: 'Descripcion',
                  render: (fila) => (
                    <span className="texto-pequeno texto-suave">{fila.descripcion || '—'}</span>
                  ),
                },
                {
                  clave: 'direccion_origen',
                  titulo: 'Origen',
                  render: (fila) => (
                    <span className="texto-pequeno texto-suave">{fila.direccion_origen || '—'}</span>
                  ),
                },
              ]}
            />

            <Pagination
              pagina={paginacionAuditoria.pagina}
              totalPaginas={paginacionAuditoria.totalPaginas}
              total={paginacionAuditoria.total}
              desde={paginacionAuditoria.desde}
              hasta={paginacionAuditoria.hasta}
              onCambiar={paginacionAuditoria.cambiarPagina}
            />
          </Card>
        </>
      )}

      {/* ------------------------------------------------------------ usuarios */}
      {pestana === 'usuarios' && (
        <>
          <Card titulo="Filtros de usuarios" subtitulo="GET /api/usuarios">
            <div className="rejilla-filtros">
              <FormField
                etiqueta="Estado"
                nombre="estadoUsuario"
                tipo="select"
                valor={filtrosUsuarios.estado}
                onChange={(evento) =>
                  setFiltrosUsuarios((anterior) => ({ ...anterior, estado: evento.target.value }))
                }
                opciones={ESTADOS_USUARIO.map((valor) => ({ valor, etiqueta: valor }))}
                placeholder="Todos los estados"
              />
              <FormField
                etiqueta="Rol"
                nombre="rolUsuario"
                tipo="select"
                valor={filtrosUsuarios.rol}
                onChange={(evento) =>
                  setFiltrosUsuarios((anterior) => ({ ...anterior, rol: evento.target.value }))
                }
                opciones={[
                  { valor: 'usuario', etiqueta: 'usuario' },
                  { valor: 'administrador', etiqueta: 'administrador' },
                ]}
                placeholder="Todos los roles"
              />
              <div className="fila">
                <button type="button" className="btn btn--secundario" onClick={() => usuarios.recargar()}>
                  Aplicar
                </button>
              </div>
            </div>
          </Card>

          <Card titulo="Usuarios registrados" subtitulo={`${paginacionUsuarios.total} usuario(s)`}>
            {usuarios.error && (
              <Alert tipo="error" titulo="No se pudo consultar la lista">
                {usuarios.error.mensaje}
              </Alert>
            )}

            <Table
              filas={paginacionUsuarios.visibles}
              cargando={usuarios.cargando}
              claveFila={(fila) => fila.id_usuario}
              vacio={{
                titulo: 'Sin usuarios',
                mensaje: 'Usa el boton Aplicar para cargar la lista con los filtros elegidos.',
                icono: '👥',
              }}
              columnas={[
                { clave: 'id_usuario', titulo: '#', alineacion: 'der' },
                {
                  clave: 'usuario',
                  titulo: 'Usuario',
                  render: (fila) => (
                    <span>
                      {fila.nombres} {fila.apellidos}
                      <br />
                      <span className="texto-pequeno texto-suave">{fila.correo}</span>
                    </span>
                  ),
                },
                { clave: 'telefono', titulo: 'Telefono', render: (fila) => fila.telefono || '—' },
                {
                  clave: 'rol',
                  titulo: 'Rol',
                  render: (fila) => (
                    <Badge tipo={fila.rol === 'administrador' ? 'primario' : 'info'}>{fila.rol}</Badge>
                  ),
                },
                {
                  clave: 'estado',
                  titulo: 'Estado',
                  render: (fila) => (
                    <Badge tipo={fila.estado === 'activo' ? 'exito' : 'neutro'}>{fila.estado}</Badge>
                  ),
                },
                {
                  clave: 'fecha_registro',
                  titulo: 'Registro',
                  render: (fila) => fechaHora(fila.fecha_registro),
                },
                {
                  clave: 'saldo_total',
                  titulo: 'Saldo total',
                  alineacion: 'der',
                  render: (fila) => <strong>{moneda(fila.saldo_total ?? 0)}</strong>,
                },
              ]}
            />

            <Pagination
              pagina={paginacionUsuarios.pagina}
              totalPaginas={paginacionUsuarios.totalPaginas}
              total={paginacionUsuarios.total}
              desde={paginacionUsuarios.desde}
              hasta={paginacionUsuarios.hasta}
              onCambiar={paginacionUsuarios.cambiarPagina}
            />
          </Card>
        </>
      )}
    </div>
  );
}
