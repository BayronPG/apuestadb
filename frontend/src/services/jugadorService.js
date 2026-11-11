import api, { desenvolver } from './api.js';

/** GET /api/equipos/:id/jugadores -> { jugadores, total } */
export async function listarJugadoresEquipo(idEquipo) {
  const respuesta = await api.get(`/equipos/${idEquipo}/jugadores`);
  return desenvolver(respuesta);
}
