'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const driveService = require('../services/drive.service');

const asociarLogos = manejarAsync(async (_req, res) => {
  const reporte = await driveService.asociarLogos();
  return res.status(200).json({ ok: true, data: reporte });
});

module.exports = { asociarLogos };
