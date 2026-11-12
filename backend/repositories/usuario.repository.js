'use strict';

/**
 * Repositorio del agregado USUARIO.
 * Encapsula el acceso a dbo.Usuario / dbo.Rol mediante procedimientos
 * almacenados y consultas parametrizadas. No contiene reglas de negocio.
 */

const { sql, p, ejecutar, consultar } = require('../config/database');
const postgresql = require('../config/db/postgresql');
const config = require('../config');

/** Con SALDO_MOTOR=postgresql los saldos del listado salen de PostgreSQL. */
function saldosEnPostgresql() {
  return config.saldo.motor === 'postgresql';
}

/**
 * Registra un usuario y crea sus cuentas de saldo en cero.
 * Invoca dbo.usp_Usuario_Registrar.
 */
async function registrar({ nombres, apellidos, correo, contrasenaHash, telefono = null }) {
  const resultado = await ejecutar(
    'dbo.usp_Usuario_Registrar',
    {
      nombres: p(sql.NVarChar(100), nombres),
      apellidos: p(sql.NVarChar(100), apellidos),
      correo: p(sql.NVarChar(150), correo),
      contrasena_hash: p(sql.VarChar(255), contrasenaHash),
      telefono: p(sql.NVarChar(20), telefono),
    },
    { id_usuario: sql.Int },
  );

  return {
    idUsuario: resultado.salidas.id_usuario,
    mensaje: resultado.registros.length > 0 ? resultado.registros[0].mensaje : null,
  };
}

/**
 * Obtiene la credencial almacenada y el rol del usuario por correo.
 * Consulta parametrizada directa: es la base de la verificacion bcrypt en el
 * backend (ver docs/backend/ARQUITECTURA.md, decision de login).
 */
async function buscarCredencialesPorCorreo(correo) {
  const resultado = await consultar(
    `SELECT TOP (1)
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.correo,
            u.telefono,
            u.contrasena,
            u.estado,
            u.id_rol,
            r.nombre AS nombre_rol
       FROM dbo.Usuario u
       JOIN dbo.Rol r ON r.id_rol = u.id_rol
      WHERE u.correo = @correo`,
    { correo: p(sql.NVarChar(150), correo) },
  );

  return resultado.registros[0] || null;
}

/** Obtiene la credencial del usuario por id (para validar la desactivacion de 2FA). */
async function buscarCredencialesPorId(idUsuario) {
  const resultado = await consultar(
    `SELECT TOP (1)
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.correo,
            u.telefono,
            u.contrasena,
            u.estado,
            r.nombre AS nombre_rol
       FROM dbo.Usuario u
       JOIN dbo.Rol r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros[0] || null;
}

/**
 * Lista los usuarios con su rol y saldo consolidado (vista vw_SaldoConsolidado).
 * @param {{estado?:string, rol?:string, limite?:number}} filtros
 */
async function listar({ estado = null, rol = null, limite = 200 } = {}) {
  const usaPg = saldosEnPostgresql();
  const resultado = await consultar(
    `SELECT TOP (@limite)
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.correo,
            u.telefono,
            u.estado,
            u.fecha_registro,
            r.nombre        AS rol
       FROM dbo.Usuario u
       JOIN dbo.Rol r ON r.id_rol = u.id_rol
      WHERE (@estado IS NULL OR u.estado = @estado)
        AND (@rol IS NULL OR r.nombre = @rol)
      ORDER BY u.fecha_registro DESC`,
    {
      limite: p(sql.Int, limite),
      estado: p(sql.VarChar(20), estado),
      rol: p(sql.VarChar(20), rol),
    },
  );

  if (!usaPg) {
    const saldosSql = await consultar(
      `SELECT id_usuario, saldo_tokens, saldo_pse, saldo_total FROM dbo.vw_SaldoConsolidado`,
    );
    const porUsuario = new Map(
      saldosSql.registros.map((fila) => [Number(fila.id_usuario), fila]),
    );
    return resultado.registros.map((fila) => {
      const saldo = porUsuario.get(Number(fila.id_usuario)) || {};
      return {
        ...fila,
        saldo_tokens: saldo.saldo_tokens ?? 0,
        saldo_pse: saldo.saldo_pse ?? 0,
        saldo_total: saldo.saldo_total ?? 0,
      };
    });
  }

  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query(
    `SELECT id_usuario, saldo_tokens, saldo_pse, saldo_total FROM vw_saldoconsolidado`,
  );
  const porUsuario = new Map(rows.map((fila) => [Number(fila.id_usuario), fila]));
  return resultado.registros.map((fila) => {
    const saldo = porUsuario.get(Number(fila.id_usuario)) || {};
    return {
      ...fila,
      saldo_tokens: saldo.saldo_tokens ?? 0,
      saldo_pse: saldo.saldo_pse ?? 0,
      saldo_total: saldo.saldo_total ?? 0,
    };
  });
}

/** Obtiene un perfil sin credenciales ni datos internos. */
async function obtenerPerfil(idUsuario) {
  const resultado = await consultar(
    `SELECT u.id_usuario,
            u.nombres,
            u.apellidos,
            u.correo,
            u.telefono,
            r.nombre AS rol
       FROM dbo.Usuario u
       JOIN dbo.Rol r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros[0] || null;
}

/** Actualiza solo los campos permitidos del perfil y devuelve el perfil seguro. */
async function actualizarPerfil({ idUsuario, cambios }) {
  const columnas = {
    nombres: { sql: 'nombres', tipo: sql.NVarChar(100) },
    apellidos: { sql: 'apellidos', tipo: sql.NVarChar(100) },
    telefono: { sql: 'telefono', tipo: sql.NVarChar(20) },
  };
  const entradas = { id_usuario: p(sql.Int, idUsuario) };
  const asignaciones = [];

  for (const [campo, definicion] of Object.entries(columnas)) {
    if (Object.prototype.hasOwnProperty.call(cambios, campo)) {
      asignaciones.push(`u.${definicion.sql} = @${campo}`);
      entradas[campo] = p(definicion.tipo, cambios[campo] === '' ? null : cambios[campo]);
    }
  }

  const resultado = await consultar(
    `UPDATE u
        SET ${asignaciones.join(', ')}
       FROM dbo.Usuario u
      WHERE u.id_usuario = @id_usuario;

      SELECT u.id_usuario,
             u.nombres,
             u.apellidos,
             u.correo,
             u.telefono,
             r.nombre AS rol
        FROM dbo.Usuario u
        JOIN dbo.Rol r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = @id_usuario;`,
    entradas,
  );

  return resultado.registros[0] || null;
}

/**
 * Solicita un token de recuperacion de contrasena.
 * Invoca dbo.usp_Auth_RecuperarContrasena con @accion = 'solicitar'.
 */
async function solicitarTokenRecuperacion(correo) {
  const resultado = await ejecutar(
    'dbo.usp_Auth_RecuperarContrasena',
    {
      accion: p(sql.VarChar(20), 'solicitar'),
      correo: p(sql.NVarChar(150), correo),
    },
    { valor_token_generado: sql.VarChar(128) },
  );

  const fila = resultado.registros[0] || {};
  return {
    valorToken: resultado.salidas.valor_token_generado || fila.valor_token || null,
    mensaje: fila.mensaje || null,
  };
}

/**
 * Restablece la contrasena con un token vigente.
 * Invoca dbo.usp_Auth_RecuperarContrasena con @accion = 'restablecer'.
 */
async function restablecerContrasena({ correo, valorToken, nuevaContrasenaHash }) {
  const resultado = await ejecutar('dbo.usp_Auth_RecuperarContrasena', {
    accion: p(sql.VarChar(20), 'restablecer'),
    correo: p(sql.NVarChar(150), correo),
    valor_token: p(sql.VarChar(128), valorToken),
    nueva_contrasena_hash: p(sql.VarChar(255), nuevaContrasenaHash),
  });

  const fila = resultado.registros[0] || {};
  return { mensaje: fila.mensaje || null };
}

module.exports = {
  registrar,
  buscarCredencialesPorCorreo,
  buscarCredencialesPorId,
  listar,
  obtenerPerfil,
  actualizarPerfil,
  solicitarTokenRecuperacion,
  restablecerContrasena,
};
