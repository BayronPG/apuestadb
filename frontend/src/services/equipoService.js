import api, { desenvolver } from './api.js';

/** GET /api/equipos -> { equipos: [{ idEquipo, nombre, logoUrl }], total } */
export async function listarEquipos() {
  const respuesta = await api.get('/equipos');
  return desenvolver(respuesta);
}
