'use strict';

const { manejarAsync } = require('../utils/asyncHandler');
const driveService = require('../services/drive.service');

const subirLogo = manejarAsync(async (req, res) => {
  const logo = await driveService.subirLogo(Number.parseInt(req.params.id, 10), req.file);
  return res.status(200).json({ ok: true, data: { logo } });
});

module.exports = { subirLogo };
