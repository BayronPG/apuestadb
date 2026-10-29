import api, { desenvolver } from './api.js';

/**
 * Servicio de ESTADO DEL SISTEMA (publico).
 *   GET /api/health -> { servicio, version, entorno, hora, uptimeSegundos, baseDatos }
 *
 * `data.baseDatos.estado` ∈ conectada | sin_respuesta | no_disponible.
 * La API responde 200 aunque la base no este disponible.
 */
export async function consultarSalud() {
  const respuesta = await api.get('/health');
  return desenvolver(respuesta);
}
