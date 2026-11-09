'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const { errores } = require('../utils/errors');
const driveService = require('../services/drive.service');
const equipoRepository = require('../repositories/equipo.repository');

const listar = manejarAsync(async (_req, res) => {
  const filas = await equipoRepository.listar();
  const equipos = filas.map((equipo) => ({
    idEquipo: equipo.id_equipo,
    nombre: equipo.nombre,
    logoUrl: equipo.logo_file_id
      ? `/api/equipos/${equipo.id_equipo}/logo`
      : driveService.logoUrl({}),
  }));
  return res.status(200).json({ ok: true, data: { equipos, total: equipos.length } });
});

const obtenerLogo = manejarAsync(async (req, res) => {
  const idEquipo = Number.parseInt(req.params.id, 10);
  const equipo = await equipoRepository.obtener(idEquipo);
  if (!equipo || !equipo.logo_file_id) {
    throw errores.noEncontrado('El equipo no tiene logo.', 'LOGO_NO_ENCONTRADO');
  }
  const { stream, mimeType } = await driveService.descargarLogo(equipo.logo_file_id);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=300');
  return stream.pipe(res);
});

const subirLogo = manejarAsync(async (req, res) => {
  const logo = await driveService.subirLogo(Number.parseInt(req.params.id, 10), req.file);
  return res.status(200).json({ ok: true, data: { logo } });
});

module.exports = { listar, obtenerLogo, subirLogo };
