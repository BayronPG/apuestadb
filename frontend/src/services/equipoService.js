import api, { desenvolver } from './api.js';

/** GET /api/equipos -> { equipos: [{ idEquipo, nombre, logoUrl }], total } */
export async function listarEquipos() {
  const respuesta = await api.get('/equipos');
  return desenvolver(respuesta);
}

/**
 * POST /api/equipos/:id/logo (multipart/form-data, rol administrador).
 * @param {number} idEquipo
 * @param {File} archivo PNG, JPG o WebP (max 5 MB)
 */
export async function subirLogoEquipo(idEquipo, archivo) {
  const formulario = new FormData();
  formulario.append('logo', archivo);
  const respuesta = await api.post(`/equipos/${idEquipo}/logo`, formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return desenvolver(respuesta);
}
