'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const driveService = require('../services/drive.service');
const equipoRepository = require('../repositories/equipo.repository');

const listar = manejarAsync(async (_req, res) => {
  const filas = await equipoRepository.listar();
  const equipos = filas.map((equipo) => ({
    idEquipo: equipo.id_equipo,
    nombre: equipo.nombre,
    logoUrl: driveService.logoUrl(equipo),
  }));
  return res.status(200).json({ ok: true, data: { equipos, total: equipos.length } });
});

const subirLogo = manejarAsync(async (req, res) => {
  const logo = await driveService.subirLogo(Number.parseInt(req.params.id, 10), req.file);
  return res.status(200).json({ ok: true, data: { logo } });
});

module.exports = { listar, subirLogo };
