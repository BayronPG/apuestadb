'use strict';

/** Persistencia del segundo factor TOTP en SQL Server (dbo.Usuario2FA). */

const { sql, p, consultar } = require('../config/database');

async function obtener(idUsuario) {
  const resultado = await consultar(
    `SELECT id_usuario, secreto_cifrado, habilitado, fecha_activacion,
            ultimo_uso, intentos_fallidos, bloqueado_hasta
       FROM dbo.Usuario2FA
      WHERE id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
  return resultado.registros[0] || null;
}

async function guardarPendiente({ idUsuario, secretoCifrado }) {
  await consultar(
    `MERGE dbo.Usuario2FA AS t
     USING (SELECT @id_usuario AS id_usuario) AS s ON t.id_usuario = s.id_usuario
     WHEN MATCHED THEN UPDATE SET
       secreto_cifrado = @secreto,
       habilitado = 0,
       fecha_activacion = NULL,
       intentos_fallidos = 0,
       bloqueado_hasta = NULL,
       actualizado_en = SYSUTCDATETIME()
     WHEN NOT MATCHED THEN INSERT (id_usuario, secreto_cifrado)
       VALUES (@id_usuario, @secreto);`,
    {
      id_usuario: p(sql.Int, idUsuario),
      secreto: p(sql.VarBinary(sql.MAX), secretoCifrado),
    },
  );
}

async function activar(idUsuario) {
  await consultar(
    `UPDATE dbo.Usuario2FA
        SET habilitado = 1,
            fecha_activacion = SYSUTCDATETIME(),
            intentos_fallidos = 0,
            bloqueado_hasta = NULL,
            actualizado_en = SYSUTCDATETIME()
      WHERE id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
}

async function desactivar(idUsuario) {
  await consultar(
    `UPDATE dbo.Usuario2FA
        SET habilitado = 0,
            secreto_cifrado = NULL,
            fecha_activacion = NULL,
            intentos_fallidos = 0,
            bloqueado_hasta = NULL,
            actualizado_en = SYSUTCDATETIME()
      WHERE id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
}

async function registrarFallo(idUsuario, maxIntentos, bloqueoMinutos) {
  const resultado = await consultar(
    `UPDATE dbo.Usuario2FA
        SET intentos_fallidos = intentos_fallidos + 1,
            bloqueado_hasta = CASE
              WHEN intentos_fallidos + 1 >= @max_intentos
                THEN DATEADD(MINUTE, @bloqueo_minutos, SYSUTCDATETIME())
              ELSE bloqueado_hasta
            END,
            actualizado_en = SYSUTCDATETIME()
      OUTPUT INSERTED.intentos_fallidos, INSERTED.bloqueado_hasta
      WHERE id_usuario = @id_usuario`,
    {
      id_usuario: p(sql.Int, idUsuario),
      max_intentos: p(sql.Int, maxIntentos),
      bloqueo_minutos: p(sql.Int, bloqueoMinutos),
    },
  );
  return resultado.registros[0] || null;
}

async function registrarExito(idUsuario) {
  await consultar(
    `UPDATE dbo.Usuario2FA
        SET intentos_fallidos = 0,
            bloqueado_hasta = NULL,
            ultimo_uso = SYSUTCDATETIME(),
            actualizado_en = SYSUTCDATETIME()
      WHERE id_usuario = @id_usuario`,
    { id_usuario: p(sql.Int, idUsuario) },
  );
}

async function estaHabilitado(idUsuario) {
  try {
    const fila = await obtener(idUsuario);
    return Boolean(fila && fila.habilitado);
  } catch (error) {
    if (/Invalid object name/i.test(String(error.message))) return false;
    throw error;
  }
}

module.exports = {
  obtener,
  guardarPendiente,
  activar,
  desactivar,
  registrarFallo,
  registrarExito,
  estaHabilitado,
};
