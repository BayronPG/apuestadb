import api, { desenvolver } from './api.js';

/**
 * Servicio de APUESTAS (usuario autenticado).
 *   POST /api/apuestas
 *   GET  /api/apuestas?estado=
 *   GET  /api/apuestas/pendientes | /ganadas | /perdidas
 *
 * Filas de historial (snake_case):
 *   { id_apuesta, fecha_hora_registro, tipo_apuesta, estado, deporte, liga,
 *     equipo_local, equipo_visitante, mercado, opcion, cuota_congelada, monto,
 *     tipo_saldo, resultado_liquidacion, monto_premio }
 */

/**
 * POST /api/apuestas -> { idApuesta, mensaje } (201)
 * `idOpcion` sale de GET /api/eventos/:id/opciones y `idTipoSaldo` de
 * GET /api/saldo (fase 10.1); ambos existen y no requieren endpoints nuevos.
 * @param {{idOpcion:number, idTipoSaldo:number, monto:number}} datos
 */
export async function registrarApuesta({ idOpcion, idTipoSaldo, monto }) {
  const respuesta = await api.post('/apuestas', { idOpcion, idTipoSaldo, monto });
  return desenvolver(respuesta);
}

/** GET /api/apuestas?estado= -> { apuestas, total } */
export async function listarApuestas(estado) {
  const parametros = estado ? { estado } : {};
  const respuesta = await api.get('/apuestas', { params: parametros });
  return desenvolver(respuesta);
}

/** GET /api/apuestas/pendientes -> { apuestas, total } */
export async function listarPendientes() {
  const respuesta = await api.get('/apuestas/pendientes');
  return desenvolver(respuesta);
}

/** GET /api/apuestas/ganadas -> { apuestas, total } */
export async function listarGanadas() {
  const respuesta = await api.get('/apuestas/ganadas');
  return desenvolver(respuesta);
}

/** GET /api/apuestas/perdidas -> { apuestas, total } */
export async function listarPerdidas() {
  const respuesta = await api.get('/apuestas/perdidas');
  return desenvolver(respuesta);
}

/**
 * Resumen por estado usando los tres listados dedicados.
 * Devuelve { pendientes, ganadas, perdidas } con sus totales y agregados.
 */
export async function resumenApuestas() {
  const [pendientes, ganadas, perdidas] = await Promise.all([
    listarPendientes(),
    listarGanadas(),
    listarPerdidas(),
  ]);

  const sumar = (lista, campo) =>
    (lista || []).reduce((acumulado, fila) => acumulado + (Number(fila[campo]) || 0), 0);

  return {
    pendientes: {
      total: pendientes.total,
      monto: sumar(pendientes.apuestas, 'monto'),
    },
    ganadas: {
      total: ganadas.total,
      monto: sumar(ganadas.apuestas, 'monto'),
      premios: sumar(ganadas.apuestas, 'monto_premio'),
    },
    perdidas: {
      total: perdidas.total,
      monto: sumar(perdidas.apuestas, 'monto'),
    },
  };
}
