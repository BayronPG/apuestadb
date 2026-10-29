'use strict';

/**
 * Traductor de errores de SQL Server a errores HTTP de la API.
 *
 * Los procedimientos almacenados de ApuestaDB señalizan las reglas de negocio
 * con THROW 50001..50224. El numero de error viaja en `error.number`; aqui se
 * convierte a { estado HTTP, codigo funcional, mensaje legible }.
 *
 * Criterio de estados:
 *   400 -> datos de entrada invalidos.
 *   403 -> operacion prohibida para el usuario/estado (incluye inhabilitado).
 *   404 -> el recurso referenciado no existe.
 *   409 -> conflicto con el estado actual (duplicados, rangos cerrados,
 *          saldo insuficiente, reglas de integridad de triggers 502xx).
 *   503 -> la base de datos no esta disponible.
 */

const { ErrorApi } = require('./errors');

const CATALOGO_PROCEDIMIENTOS = {
  // --- usp_Usuario_Registrar (50001-50008) ---
  50001: { estado: 400, codigo: 'NOMBRE_OBLIGATORIO', mensaje: 'El nombre es obligatorio.' },
  50002: { estado: 400, codigo: 'APELLIDO_OBLIGATORIO', mensaje: 'El apellido es obligatorio.' },
  50003: { estado: 400, codigo: 'CORREO_INVALIDO', mensaje: 'El correo no es valido.' },
  50004: { estado: 400, codigo: 'CREDENCIAL_INVALIDA', mensaje: 'La credencial (hash) no es valida.' },
  50005: { estado: 409, codigo: 'CORREO_REGISTRADO', mensaje: 'El correo ya esta registrado.' },
  50006: { estado: 409, codigo: 'TELEFONO_REGISTRADO', mensaje: 'El telefono ya esta registrado.' },
  50007: { estado: 400, codigo: 'ROL_NO_CONFIGURADO', mensaje: 'No existe el rol "usuario" (ejecute 05_seed_data.sql).' },
  50008: { estado: 400, codigo: 'SALDOS_NO_CREADOS', mensaje: 'No se pudieron crear las cuentas de saldo.' },

  // --- usp_Auth_IniciarSesion (50010-50013) ---
  50010: { estado: 400, codigo: 'CREDENCIALES_REQUERIDAS', mensaje: 'Debe indicar correo y contrasena.' },
  50011: { estado: 401, codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Credenciales invalidas.' },
  50012: { estado: 403, codigo: 'USUARIO_INHABILITADO', mensaje: 'El usuario esta inhabilitado.' },
  50013: { estado: 401, codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Credenciales invalidas.' },

  // --- usp_Auth_RecuperarContrasena (50020-50024) ---
  50020: { estado: 400, codigo: 'ACCION_INVALIDA', mensaje: 'Accion no valida.' },
  50021: { estado: 400, codigo: 'CORREO_OBLIGATORIO', mensaje: 'El correo es obligatorio.' },
  50022: { estado: 404, codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'No existe un usuario activo con ese correo.' },
  50023: { estado: 400, codigo: 'TOKEN_Y_CREDENCIAL_REQUERIDOS', mensaje: 'Debe indicar el token y la nueva credencial.' },
  50024: { estado: 400, codigo: 'TOKEN_NO_VALIDO', mensaje: 'El token no es valido o ha expirado.' },

  // --- usp_Saldo_Consultar (50030) ---
  50030: { estado: 404, codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'El usuario no existe.' },

  // --- usp_MovimientoSaldo_Registrar (50040-50044) ---
  50040: { estado: 400, codigo: 'MONTO_INVALIDO', mensaje: 'El monto debe ser mayor que cero.' },
  50041: { estado: 400, codigo: 'ORIGEN_EXCLUYENTE', mensaje: 'El movimiento no puede originarse en apuesta y recarga a la vez.' },
  50042: { estado: 400, codigo: 'TIPO_MOVIMIENTO_INVALIDO', mensaje: 'Tipo de movimiento no valido.' },
  50043: { estado: 404, codigo: 'CUENTA_NO_ENCONTRADA', mensaje: 'La cuenta de saldo no existe.' },
  50044: { estado: 409, codigo: 'SALDO_INSUFICIENTE', mensaje: 'Saldo insuficiente para completar la operacion.' },

  // --- usp_Recarga_Crear (50050-50054) ---
  50050: { estado: 400, codigo: 'MONTO_INVALIDO', mensaje: 'El monto de la recarga debe ser mayor que cero.' },
  50051: { estado: 404, codigo: 'USUARIO_NO_ACTIVO', mensaje: 'El usuario no existe o no esta activo.' },
  50052: { estado: 400, codigo: 'TIPO_SALDO_INVALIDO', mensaje: 'El tipo de saldo no es valido.' },
  50053: { estado: 403, codigo: 'ADMINISTRADOR_INVALIDO', mensaje: 'El administrador indicado no es valido.' },
  50054: { estado: 404, codigo: 'CUENTA_NO_ENCONTRADA', mensaje: 'El usuario no tiene cuenta para ese tipo de saldo.' },

  // --- usp_Apuesta_Registrar (50044, 50060-50069) ---
  50060: { estado: 404, codigo: 'OPCION_NO_ENCONTRADA', mensaje: 'La opcion de apuesta no existe.' },
  50061: { estado: 400, codigo: 'OPCION_NO_HABILITADA', mensaje: 'La opcion de apuesta no esta habilitada.' },
  50062: { estado: 409, codigo: 'MERCADO_CERRADO', mensaje: 'El mercado no esta abierto.' },
  50063: { estado: 409, codigo: 'MERCADO_CERRADO', mensaje: 'El mercado ya cerro.' },
  50064: { estado: 409, codigo: 'EVENTO_NO_DISPONIBLE', mensaje: 'El evento no esta disponible para apostar.' },
  50065: { estado: 409, codigo: 'EVENTO_INICIADO', mensaje: 'El evento ya inicio.' },
  50066: { estado: 404, codigo: 'USUARIO_NO_ACTIVO', mensaje: 'El usuario no existe o no esta activo.' },
  50067: { estado: 400, codigo: 'MONTO_INVALIDO', mensaje: 'El monto debe ser mayor que cero.' },
  50068: { estado: 400, codigo: 'TIPO_SALDO_INVALIDO', mensaje: 'El tipo de saldo no es valido.' },
  50069: { estado: 404, codigo: 'CUENTA_NO_ENCONTRADA', mensaje: 'El usuario no tiene cuenta para ese tipo de saldo.' },

  // --- usp_Apuesta_Liquidar (50070-50075) ---
  50070: { estado: 400, codigo: 'CRITERIO_REQUERIDO', mensaje: 'Debe indicar la apuesta o el evento a liquidar.' },
  50071: { estado: 400, codigo: 'CRITERIO_EXCLUYENTE', mensaje: 'Indique solo la apuesta o solo el evento, no ambos.' },
  50072: { estado: 404, codigo: 'APUESTA_NO_ENCONTRADA', mensaje: 'La apuesta no existe.' },
  50073: { estado: 404, codigo: 'EVENTO_NO_ENCONTRADO', mensaje: 'El evento no existe.' },
  50074: { estado: 404, codigo: 'CUENTA_NO_ENCONTRADA', mensaje: 'No existe la cuenta de saldo del usuario.' },
  50075: { estado: 409, codigo: 'APUESTA_YA_LIQUIDADA', mensaje: 'La apuesta ya fue liquidada.' },

  // --- usp_Evento_RegistrarResultado (50080-50084) ---
  50080: { estado: 404, codigo: 'EVENTO_NO_ENCONTRADO', mensaje: 'El evento no existe.' },
  50081: { estado: 400, codigo: 'MARCADOR_INVALIDO', mensaje: 'Los marcadores deben ser mayores o iguales a cero.' },
  50082: { estado: 400, codigo: 'ESTADO_RESULTADO_INVALIDO', mensaje: 'El estado del resultado no es valido.' },
  50083: { estado: 409, codigo: 'EVENTO_CANCELADO', mensaje: 'No se puede registrar el resultado de un evento cancelado.' },
  50084: { estado: 409, codigo: 'RESULTADO_DUPLICADO', mensaje: 'El evento ya tiene un resultado registrado.' },

  // --- usp_Notificacion_Crear (50090-50092) ---
  50090: { estado: 404, codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'El usuario no existe.' },
  50091: { estado: 400, codigo: 'MENSAJE_OBLIGATORIO', mensaje: 'El mensaje de la notificacion es obligatorio.' },
  50092: { estado: 400, codigo: 'TIPO_NOTIFICACION_OBLIGATORIO', mensaje: 'El tipo de notificacion es obligatorio.' },

  // --- Historiales de lectura (50100-50102) ---
  50100: { estado: 404, codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'El usuario no existe.' },
  50101: { estado: 404, codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'El usuario no existe.' },
  50102: { estado: 400, codigo: 'RANGO_FECHAS_INVALIDO', mensaje: 'El rango de fechas no es valido.' },

  // --- usp_Auditoria_Registrar / Consultar (50110-50113) ---
  50110: { estado: 400, codigo: 'OPERACION_OBLIGATORIA', mensaje: 'La operacion de auditoria es obligatoria.' },
  50111: { estado: 400, codigo: 'ENTIDAD_OBLIGATORIA', mensaje: 'La entidad afectada es obligatoria.' },
  50112: { estado: 400, codigo: 'RESULTADO_AUDITORIA_INVALIDO', mensaje: 'El resultado de auditoria no es valido.' },
  50113: { estado: 400, codigo: 'RANGO_FECHAS_INVALIDO', mensaje: 'El rango de fechas no es valido.' },

  // --- Triggers de integridad (50200-50224) ---
  50200: { estado: 409, codigo: 'AUDITORIA_NO_REGISTRADA', mensaje: 'No se pudo registrar la auditoria del cambio.' },
  50201: { estado: 409, codigo: 'SALDO_NEGATIVO', mensaje: 'El saldo de la cuenta no puede ser negativo.' },
  50202: { estado: 409, codigo: 'CUENTA_INMUTABLE', mensaje: 'No se permite eliminar cuentas de saldo (registro critico).' },
  50203: { estado: 409, codigo: 'MOVIMIENTO_INMUTABLE', mensaje: 'Los movimientos de saldo son inmutables: no se permite eliminarlos.' },
  50204: { estado: 409, codigo: 'HISTORIAL_INMUTABLE', mensaje: 'El historial de cuotas es inmutable: no se permite eliminarlo.' },
  50205: { estado: 409, codigo: 'SALDO_NO_SINCRONIZADO', mensaje: 'No se pudo sincronizar el saldo de la cuenta tras el movimiento.' },
  50206: { estado: 409, codigo: 'HISTORIAL_CUOTA_NO_REGISTRADO', mensaje: 'No se pudo registrar el historial de cuota de la opcion.' },
  50210: { estado: 409, codigo: 'EVENTO_CANCELADO', mensaje: 'No se puede registrar un resultado de un evento cancelado o suspendido.' },
  50211: { estado: 409, codigo: 'MARCADOR_INVALIDO', mensaje: 'Los marcadores no pueden ser negativos.' },
  50212: { estado: 409, codigo: 'RESULTADO_DUPLICADO', mensaje: 'No puede haber mas de un resultado por evento.' },
  50213: { estado: 409, codigo: 'RESULTADO_INMUTABLE', mensaje: 'No se puede eliminar un resultado oficial o con liquidaciones asociadas.' },
  50220: { estado: 409, codigo: 'LIQUIDACION_NO_OFICIAL', mensaje: 'Solo se puede liquidar con un resultado en estado oficial.' },
  50221: { estado: 409, codigo: 'RESULTADO_NO_CORRESPONDE', mensaje: 'El resultado no corresponde al evento de la apuesta.' },
  50222: { estado: 409, codigo: 'PREMIO_INCOHERENTE', mensaje: 'El monto del premio no es coherente con el desenlace de la liquidacion.' },
  50223: { estado: 409, codigo: 'LIQUIDACION_DUPLICADA', mensaje: 'No puede haber mas de una liquidacion por apuesta.' },
  50224: { estado: 409, codigo: 'LIQUIDACION_INMUTABLE', mensaje: 'Las liquidaciones son inmutables: no se permite eliminarlas.' },
};

const CATALOGO_ERRORES_SQL = {
  2627: { estado: 409, codigo: 'REGISTRO_DUPLICADO', mensaje: 'Ya existe un registro con esos datos.' },
  2601: { estado: 409, codigo: 'REGISTRO_DUPLICADO', mensaje: 'Ya existe un registro con esos datos.' },
  547: { estado: 409, codigo: 'INTEGRIDAD_REFERENCIAL', mensaje: 'La operacion viola una restriccion de integridad referencial.' },
  515: { estado: 400, codigo: 'CAMPO_OBLIGATORIO', mensaje: 'Falta un valor obligatorio.' },
  8152: { estado: 400, codigo: 'LONGITUD_EXCEDIDA', mensaje: 'El valor excede la longitud permitida.' },
  245: { estado: 400, codigo: 'CONVERSION_INVALIDA', mensaje: 'Valor con formato invalido.' },
  208: { estado: 503, codigo: 'OBJETO_NO_EXISTE', mensaje: 'No existe el objeto de base de datos esperado (revise los scripts de database/).' },
  2812: { estado: 503, codigo: 'PROCEDIMIENTO_NO_EXISTE', mensaje: 'No existe el procedimiento almacenado esperado.' },
  4060: { estado: 503, codigo: 'BD_NO_DISPONIBLE', mensaje: 'No se puede abrir la base de datos indicada.' },
  18456: { estado: 503, codigo: 'CREDENCIALES_BD', mensaje: 'Error de autenticacion contra SQL Server.' },
  40613: { estado: 503, codigo: 'BD_NO_DISPONIBLE', mensaje: 'La base de datos no esta disponible.' },
};

const CATALOGO_ERRORES_TECNICOS = {
  ETIMEOUT: { estado: 504, codigo: 'TIEMPO_AGOTADO_BD', mensaje: 'La base de datos no respondio en el tiempo esperado.' },
  ETIMEDOUT: { estado: 504, codigo: 'TIEMPO_AGOTADO_BD', mensaje: 'La base de datos no respondio en el tiempo esperado.' },
  ECONNCLOSED: { estado: 503, codigo: 'CONEXION_CERRADA', mensaje: 'La conexion con la base de datos se cerro.' },
  ECONNREFUSED: { estado: 503, codigo: 'CONEXION_RECHAZADA', mensaje: 'No se pudo conectar con SQL Server.' },
  ECONNRESET: { estado: 503, codigo: 'CONEXION_RECHAZADA', mensaje: 'No se pudo conectar con SQL Server.' },
  ELOGIN: { estado: 503, codigo: 'CREDENCIALES_BD', mensaje: 'Error de autenticacion contra SQL Server.' },
  ENOTOPEN: { estado: 503, codigo: 'CONEXION_NO_ABIERTA', mensaje: 'La conexion con la base de datos no esta abierta.' },
  ESOCKET: { estado: 503, codigo: 'CONEXION_RECHAZADA', mensaje: 'No se pudo establecer la conexion con SQL Server.' },
  EPARSE: { estado: 400, codigo: 'RESPUESTA_INVALIDA', mensaje: 'Respuesta invalida del servidor de base de datos.' },
};

const NOMBRES_ERRORES_BD = ['RequestError', 'ConnectionError', 'TransactionError'];

/**
 * Intenta traducir un error de SQL Server a un ErrorApi.
 * @returns {ErrorApi|null} null si el error no es reconocible como de BD.
 */
function mapearErrorSql(error) {
  if (!error) return null;
  if (error instanceof ErrorApi) return error;

  const numero = Number(error.number);
  if (Number.isFinite(numero)) {
    const entrada = CATALOGO_PROCEDIMIENTOS[numero] || CATALOGO_ERRORES_SQL[numero];
    if (entrada) {
      const mensaje = error.originalError && error.originalError.info && error.originalError.info.message;
      return new ErrorApi(entrada.codigo, entrada.mensaje || mensaje, entrada.estado);
    }
  }

  const codigoTecnico = error.code || error.name;
  if (codigoTecnico && CATALOGO_ERRORES_TECNICOS[codigoTecnico]) {
    const entrada = CATALOGO_ERRORES_TECNICOS[codigoTecnico];
    return new ErrorApi(entrada.codigo, entrada.mensaje, entrada.estado);
  }

  if (NOMBRES_ERRORES_BD.includes(error.name)) {
    return new ErrorApi('ERROR_BD', 'Error al comunicarse con la base de datos.', 503);
  }

  return null;
}

module.exports = {
  mapearErrorSql,
  CATALOGO_PROCEDIMIENTOS,
  CATALOGO_ERRORES_SQL,
  CATALOGO_ERRORES_TECNICOS,
};
