// Middlewares de proteccion de rutas.

/** Exige una sesion activa (req.session.usuario). */
export function requiereSesion(req, res, next) {
  if (req.session && req.session.usuario) return next()
  return res
    .status(401)
    .json({ mensaje: 'No hay una sesión activa. Inicia sesión para continuar.' })
}

/** Exige sesion activa y rol administrador. */
export function requiereAdmin(req, res, next) {
  if (req.session && req.session.usuario) {
    if (req.session.usuario.rol === 'admin') return next()
    return res
      .status(403)
      .json({ mensaje: 'Acceso restringido: esta acción requiere rol de administrador.' })
  }
  return res
    .status(401)
    .json({ mensaje: 'No hay una sesión activa. Inicia sesión para continuar.' })
}
