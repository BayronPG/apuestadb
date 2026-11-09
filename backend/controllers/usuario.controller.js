'use strict';

/**
 * Controlador de USUARIOS.
 */

const { manejarAsync } = require('../utils/asyncHandler');
const usuarioService = require('../services/usuario.service');

/** GET /api/usuarios/perfil */
const obtenerPerfil = manejarAsync(async (req, res) => {
  const datos = await usuarioService.obtenerPerfil(req.usuario.id);
  return res.status(200).json({ ok: true, data: datos });
});

/** PUT /api/usuarios/perfil */
const actualizarPerfil = manejarAsync(async (req, res) => {
  const datos = await usuarioService.actualizarPerfil({
    idUsuario: req.usuario.id,
    cambios: req.body,
  });
  return res.status(200).json({ ok: true, data: datos });
});

/** GET /api/usuarios */
const listar = manejarAsync(async (req, res) => {
  const { estado = null, rol = null, limite = 200 } = req.query;

  const usuarios = await usuarioService.listar({
    estado: estado || null,
    rol: rol || null,
    limite: Number.parseInt(limite, 10) || 200,
  });

  return res.status(200).json({ ok: true, data: { usuarios, total: usuarios.length } });
});

module.exports = { listar, obtenerPerfil, actualizarPerfil };
