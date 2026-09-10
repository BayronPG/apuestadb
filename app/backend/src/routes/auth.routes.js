import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getPool, sql } from '../db.js'

const router = Router()

// Coste del hash (10 rondas: equilibrio razonable velocidad/seguridad en sandbox)
const RONDAS_HASH = 10

// Hash de una clave ficticia, usado solo para "comparar" cuando el correo no
// existe: iguala el tiempo de respuesta y evita revelar si la cuenta existe.
const HASH_DUMMY = bcrypt.hashSync('clave-inexistente-apuestadb', RONDAS_HASH)

/**
 * Divide "Nombre completo" en las 4 columnas de la tabla Usuario.
 * Regla documentada (sandbox):
 *   - 2 palabras -> primer_nombre + primer_apellido
 *   - 3 palabras -> primer_nombre + primer_apellido + segundo_apellido
 *                   (convencion colombiana: 1 nombre + 2 apellidos)
 *   - 4 palabras -> primer_nombre + segundo_nombre + primer_apellido + segundo_apellido
 */
function dividirNombreCompleto(nombreCompleto) {
  const partes = String(nombreCompleto ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (partes.length < 2 || partes.length > 4) return null
  const [p1, p2, p3, p4] = partes
  if (partes.length === 2) {
    return { primer_nombre: p1, segundo_nombre: null, primer_apellido: p2, segundo_apellido: null }
  }
  if (partes.length === 3) {
    return { primer_nombre: p1, segundo_nombre: null, primer_apellido: p2, segundo_apellido: p3 }
  }
  return { primer_nombre: p1, segundo_nombre: p2, primer_apellido: p3, segundo_apellido: p4 }
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const {
    nombreCompleto,
    tipoDocumento,
    numeroDocumento,
    correo,
    celular,
    clave,
    clave2,
  } = req.body ?? {}

  // ---- Validaciones de negocio ----
  const errores = []
  const nombres = dividirNombreCompleto(nombreCompleto)
  if (!nombres) {
    errores.push('Ingresa tu nombre completo: mínimo nombre y un apellido (máx. 4 palabras).')
  }

  const tipoDoc = String(tipoDocumento ?? '').trim().toUpperCase()
  if (!['CC', 'CE', 'TI', 'PAS'].includes(tipoDoc)) {
    errores.push('Tipo de documento inválido (usa CC, CE, TI o PAS).')
  }

  const numDoc = String(numeroDocumento ?? '').trim()
  if (!/^[A-Za-z0-9]{4,20}$/.test(numDoc)) {
    errores.push('Número de documento inválido (4 a 20 caracteres alfanuméricos).')
  }

  const mail = String(correo ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    errores.push('El correo electrónico no tiene un formato válido.')
  }

  const cel = String(celular ?? '').trim()
  if (!/^\d{7,15}$/.test(cel)) {
    errores.push('Número de celular inválido (7 a 15 dígitos).')
  }

  if (!clave || String(clave).length < 8) {
    errores.push('La contraseña debe tener mínimo 8 caracteres.')
  }
  if (clave !== clave2) {
    errores.push('Las contraseñas no coinciden.')
  }

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: errores.join(' ') })
  }

  try {
    const pool = await getPool()
    const tx = pool.transaction()
    await tx.begin()

    try {
      // ---- Evitar duplicados (correo; tipo + numero de documento - regla P10) ----
      const duplicado = await tx
        .request()
        .input('correo', sql.NVarChar(150), mail)
        .input('tipo', sql.VarChar(10), tipoDoc)
        .input('doc', sql.VarChar(20), numDoc)
        .query(
          `SELECT correo, tipo_documento, numero_documento FROM Usuario
           WHERE correo = @correo OR (tipo_documento = @tipo AND numero_documento = @doc)`,
        )

      if (duplicado.recordset.some((r) => (r.correo ?? '').toLowerCase() === mail)) {
        await tx.rollback()
        return res
          .status(409)
          .json({ mensaje: 'Ya existe una cuenta con ese correo electrónico.' })
      }
      if (
        duplicado.recordset.some(
          (r) =>
            String(r.tipo_documento).trim() === tipoDoc &&
            String(r.numero_documento).trim() === numDoc,
        )
      ) {
        await tx.rollback()
        return res
          .status(409)
          .json({ mensaje: 'Ya existe un usuario con ese tipo y número de documento.' })
      }

      // ---- Rol por defecto: 'usuario' (obtenido de la BD, nunca hardcodeado el id) ----
      const rol = await tx.request().query("SELECT id FROM Rol WHERE nombre = 'usuario'")
      if (rol.recordset.length === 0) {
        await tx.rollback()
        return res
          .status(500)
          .json({ mensaje: 'Catálogo de roles no configurado en la base de datos.' })
      }
      const rolId = rol.recordset[0].id

      // ---- Hash de la contrasena (bcrypt) ----
      const hash = await bcrypt.hash(String(clave), RONDAS_HASH)

      // ---- Insertar usuario ----
      const ins = await tx
        .request()
        .input('pn', sql.NVarChar(60), nombres.primer_nombre)
        .input('sn', sql.NVarChar(60), nombres.segundo_nombre)
        .input('pa', sql.NVarChar(60), nombres.primer_apellido)
        .input('sa', sql.NVarChar(60), nombres.segundo_apellido)
        .input('rol', sql.Int, rolId)
        .input('td', sql.VarChar(10), tipoDoc)
        .input('nd', sql.VarChar(20), numDoc)
        .input('cel', sql.VarChar(15), cel)
        .input('mail', sql.NVarChar(150), mail)
        .input('hash', sql.NVarChar(255), hash)
        .query(
          `INSERT INTO Usuario
             (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
              rol_id, tipo_documento, numero_documento, celular, correo, contrasena_hash, estado)
           OUTPUT INSERTED.id
           VALUES (@pn, @sn, @pa, @sa, @rol, @td, @nd, @cel, @mail, @hash, 'activo')`,
        )
      const usuarioId = ins.recordset[0].id

      // ---- Saldos iniciales en 0 (tokens y PSE) si los tipos existen ----
      // Justificacion: el modelo (reglas R1/R5 del profesor) maneja saldo por tipo;
      // se crean ambas cuentas al registrar para que el usuario pueda recargar cualquiera.
      const tipos = await tx
        .request()
        .query("SELECT id FROM TipoSaldo WHERE nombre IN ('tokens', 'pse')")
      for (const tipo of tipos.recordset) {
        await tx
          .request()
          .input('uid', sql.Int, usuarioId)
          .input('tid', sql.Int, tipo.id)
          .query(
            `INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
             VALUES (@uid, @tid, 0, 'activa')`,
          )
      }

      await tx.commit()

      // Nunca se devuelve el hash al cliente.
      return res.status(201).json({
        mensaje: 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
        usuario: { id: usuarioId, correo: mail },
      })
    } catch (err) {
      try { await tx.rollback() } catch { /* ya revertida */ }
      throw err
    }
  } catch (err) {
    console.error('Error en registro:', err)
    return res.status(500).json({ mensaje: 'Error interno al registrar el usuario.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, clave } = req.body ?? {}
  const mail = String(correo ?? '').trim().toLowerCase()

  if (!mail || !clave) {
    return res.status(400).json({ mensaje: 'Ingresa tu correo y tu contraseña.' })
  }

  try {
    const pool = await getPool()

    const q = await pool
      .request()
      .input('mail', sql.NVarChar(150), mail)
      .query(
        `SELECT u.id, u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido,
                u.correo, u.estado, u.contrasena_hash, r.nombre AS rol
         FROM Usuario u
         JOIN Rol r ON r.id = u.rol_id
         WHERE u.correo = @mail`,
      )
    const fila = q.recordset[0]
    const ip = req.ip ?? null

    let claveOk = false
    if (fila) {
      try {
        claveOk = await bcrypt.compare(String(clave), fila.contrasena_hash)
      } catch {
        // Hash almacenado invalido (p.ej. marcador de prueba): se trata como clave incorrecta.
        claveOk = false
      }
    } else {
      // Usuario inexistente: comparacion ficticia para no delatar la existencia del correo.
      try { await bcrypt.compare(String(clave), HASH_DUMMY) } catch { /* noop */ }
    }

    // Bitacora en tabla Login (solo si existe el usuario: la tabla exige usuario_id NOT NULL).
    if (fila) {
      try {
        await pool
          .request()
          .input('uid', sql.Int, fila.id)
          .input('ip', sql.VarChar(45), ip)
          .input('ok', sql.Bit, claveOk ? 1 : 0)
          .query('INSERT INTO Login (usuario_id, ip, exitoso) VALUES (@uid, @ip, @ok)')
      } catch (err) {
        console.warn('No se pudo registrar intento en Login:', err.message)
      }
    }

    // Mensaje generico: no se revela si el correo existe, ni si la cuenta esta inactiva.
    if (!fila || !claveOk || fila.estado !== 'activo') {
      return res
        .status(401)
        .json({ mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.' })
    }

    req.session.usuario = {
      id: fila.id,
      correo: fila.correo,
      rol: fila.rol,
      nombre: [fila.primer_nombre, fila.segundo_nombre, fila.primer_apellido, fila.segundo_apellido]
        .filter(Boolean)
        .join(' '),
    }

    return res.json({ mensaje: 'Sesión iniciada correctamente.', usuario: req.session.usuario })
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ mensaje: 'Error interno al iniciar sesión.' })
  }
})

// GET /api/auth/sesion — devuelve la sesion activa (o 401)
router.get('/sesion', (req, res) => {
  if (req.session && req.session.usuario) {
    return res.json({ usuario: req.session.usuario })
  }
  return res.status(401).json({ mensaje: 'No hay una sesión activa.' })
})

// POST /api/auth/logout — destruye la sesion y limpia la cookie
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err)
      return res.status(500).json({ mensaje: 'No se pudo cerrar la sesión.' })
    }
    res.clearCookie('apuestadb.sid')
    return res.json({ mensaje: 'Sesión cerrada correctamente.' })
  })
})

export default router
