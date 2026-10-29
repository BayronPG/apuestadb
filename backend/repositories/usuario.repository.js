'use strict';

/**
 * Repositorio del agregado USUARIO.
 * Encapsula el acceso a dbo.Usuario / dbo.Rol mediante procedimientos
 * almacenados y consultas parametrizadas. No contiene reglas de negocio.
 */

const { sql, p, ejecutar, consultar } = require('../config/database');

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

/**
 * Lista los usuarios con su rol y saldo consolidado (vista vw_SaldoConsolidado).
 * @param {{estado?:string, rol?:string, limite?:number}} filtros
 */
async function listar({ estado = null, rol = null, limite = 200 } = {}) {
  const resultado = await consultar(
    `SELECT TOP (@limite)
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.correo,
            u.telefono,
            u.estado,
            u.fecha_registro,
            r.nombre        AS rol,
            sc.saldo_tokens,
            sc.saldo_pse,
            sc.saldo_total
       FROM dbo.Usuario u
       JOIN dbo.Rol r ON r.id_rol = u.id_rol
       LEFT JOIN dbo.vw_SaldoConsolidado sc ON sc.id_usuario = u.id_usuario
      WHERE (@estado IS NULL OR u.estado = @estado)
        AND (@rol IS NULL OR r.nombre = @rol)
      ORDER BY u.fecha_registro DESC`,
    {
      limite: p(sql.Int, limite),
      estado: p(sql.VarChar(20), estado),
      rol: p(sql.VarChar(20), rol),
    },
  );

  return resultado.registros;
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
  listar,
  solicitarTokenRecuperacion,
  restablecerContrasena,
};
