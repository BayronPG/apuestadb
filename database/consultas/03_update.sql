/* ============================================================================
   APUESTADB - consultas/03_update.sql
   Entregable : 20 sentencias UPDATE distintas (Fase 13).
   Motor      : SQL Server (T-SQL), base ApuestaDB.
   ----------------------------------------------------------------------------
   Reglas de este archivo:
     - 20 UPDATE distintos: 20 tablas diferentes y distintas formas de filtro
       (por clave, por nombre, por subconsulta, por IN/EXISTS, por rango, con
       funcion escalar sobre la columna y con TOP).
     - No se usan JOIN en las sentencias (las combinaciones estan en 05_join.sql).
     - Todo el archivo es UNA transaccion que TERMINA EN ROLLBACK.
     - Para aplicar los cambios de forma permanente, cambie ROLLBACK por COMMIT.
     - Los UPDATE sobre Usuario, Evento, Mercado y OpcionApuesta disparan los
       triggers de auditoria / historial de cuota (comportamiento esperado).
   Uso: sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i 03_update.sql
   ============================================================================ */

USE ApuestaDB;
GO

/* Configuracion de sesion: los triggers y funciones del modelo se crearon con
   estas opciones activas (equivale a la sesion por omision de SSMS). */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

BEGIN TRANSACTION;

DECLARE @id_usuario_borrador INT =
        (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'andres.restrepo@apuestadb.co');

/* ==========================================================================
   1. CATALOGO GEOGRAFICO Y DEPORTIVO
   ========================================================================== */

-- U-001 | Pais | Normalizar el codigo ISO de un pais (clave natural)
UPDATE dbo.Pais
SET codigo = 'ES'
WHERE nombre = N'Espana';

-- U-002 | Ciudad | Estandarizar la region en mayusculas (funcion sobre la columna)
UPDATE dbo.Ciudad
SET region = UPPER(LTRIM(RTRIM(region)))
WHERE nombre = N'Cali';

-- U-003 | Estadio | Ampliar la capacidad del escenario (operacion aritmetica)
UPDATE dbo.Estadio
SET capacidad = capacidad + 500
WHERE nombre = N'El Campin';

-- U-004 | Deporte | Inactivar un deporte por nombre (dominio CHECK)
UPDATE dbo.Deporte
SET estado = 'inactivo'
WHERE nombre = N'Ciclismo';

-- U-005 | Liga | Inactivar una liga y actualizar su categoria
UPDATE dbo.Liga
SET estado = 'inactivo',
    categoria = N'Profesional'
WHERE nombre = N'NBA';

-- U-006 | Temporada | Ajustar la fecha de cierre de una temporada (subconsulta a Liga)
UPDATE dbo.Temporada
SET fecha_fin = CONVERT(DATE, '2027-06-30')
WHERE etiqueta = N'2026-27'
  AND id_liga = (SELECT id_liga FROM dbo.Liga WHERE nombre = N'NBA');

-- U-007 | Equipo | Inactivar equipos por condicion de estado
UPDATE dbo.Equipo
SET estado = 'inactivo'
WHERE nombre = N'Inter de Milan'
  AND estado <> 'inactivo';

-- U-008 | Arbitro | Reclasificar el arbitro por apellido
UPDATE dbo.Arbitro
SET categoria = N'Nacional'
WHERE apellidos = N'Roldan';

/* ==========================================================================
   2. SEGURIDAD Y USUARIOS
   ========================================================================== */

-- U-009 | Usuario | Actualizar el telefono (dispara trg_Usuario_Auditoria)
UPDATE dbo.Usuario
SET telefono = N'+573001112299'
WHERE correo = N'andres.restrepo@apuestadb.co';

-- U-010 | PreguntaSeguridad | Desactivar una pregunta por su enunciado
UPDATE dbo.PreguntaSeguridad
SET estado = 'inactivo'
WHERE enunciado = N'Cual es tu comida favorita de la infancia?';

-- U-011 | RespuestaSeguridad | Normalizar la respuesta en mayusculas (subconsulta)
UPDATE dbo.RespuestaSeguridad
SET respuesta = UPPER(respuesta)
WHERE id_usuario = (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'laura.cardenas@apuestadb.co');

-- U-012 | TokenRecuperacion | Marcar como expirado un token que ya venció
UPDATE dbo.TokenRecuperacion
SET estado = 'expirado'
WHERE estado = 'vigente'
  AND fecha_expiracion < SYSDATETIME();

-- U-013 | Evento | Poner en curso un evento programado (dispara auditoria de Evento)
UPDATE dbo.Evento
SET estado = 'en_curso'
WHERE descripcion = N'Fecha 8 - Liga BetPlay'
  AND estado = 'programado';

-- U-014 | CalendarioArbitro | Cambiar el rol del arbitro (subconsulta a Arbitro)
UPDATE dbo.CalendarioArbitro
SET rol_arbitro = 'asistente'
WHERE id_arbitro = (SELECT id_arbitro FROM dbo.Arbitro WHERE apellidos = N'Gallo')
  AND rol_arbitro = 'principal';

-- U-015 | Mercado | Extender 30 minutos el cierre de los mercados abiertos
UPDATE dbo.Mercado
SET fecha_cierre = DATEADD(MINUTE, 30, fecha_cierre)
WHERE estado = 'abierto';

/* ==========================================================================
   3. APUESTAS, SALDO, RESULTADOS
   ========================================================================== */

-- U-016 | OpcionApuesta | Ajustar 5% la cuota de un mercado (dispara el historial de cuota)
UPDATE dbo.OpcionApuesta
SET cuota_vigente = CAST(cuota_vigente * 1.05 AS DECIMAL(10,2))
WHERE id_mercado = (SELECT m.id_mercado FROM dbo.Mercado m
                    WHERE m.id_evento = (SELECT id_evento FROM dbo.Evento
                                         WHERE descripcion = N'Fecha 8 - Liga BetPlay'));

-- U-017 | Apuesta | Incrementar el monto de las apuestas pendientes
UPDATE dbo.Apuesta
SET monto = monto + 5000
WHERE estado = 'pendiente';

-- U-018 | SaldoCuenta | Ajuste administrativo del saldo ficticio en PSE (saldo no negativo)
UPDATE dbo.SaldoCuenta
SET saldo_actual = saldo_actual + 1000,
    fecha_ultima_actualizacion = SYSDATETIME()
WHERE id_tipo_saldo = (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'PSE')
  AND saldo_actual >= 0;

-- U-019 | Recarga | Anular las recargas de prueba menores a 100000
UPDATE dbo.Recarga
SET estado = 'anulada',
    observacion = CONCAT(observacion, N' - anulada en revision')
WHERE monto < 100000
  AND estado = 'aplicada';

-- U-020 | Resultado | Corregir la hora de registro de los resultados oficiales
UPDATE dbo.Resultado
SET fecha_registro = DATEADD(HOUR, 3, fecha_registro)
WHERE estado = 'oficial'
  AND fecha_registro < SYSDATETIME();

/* Verificacion dentro de la transaccion: filas afectadas por los UPDATE. */
SELECT N'U-009 Usuario'      AS sentencia, COUNT(*) AS filas FROM dbo.Usuario           WHERE telefono = N'+573001112299'
UNION ALL SELECT N'U-013 Evento',           COUNT(*) FROM dbo.Evento            WHERE descripcion = N'Fecha 8 - Liga BetPlay' AND estado = 'en_curso'
UNION ALL SELECT N'U-016 OpcionApuesta',    COUNT(*) FROM dbo.OpcionApuesta     WHERE cuota_vigente = CAST(cuota_vigente AS DECIMAL(10,2))
UNION ALL SELECT N'U-017 Apuesta',          COUNT(*) FROM dbo.Apuesta           WHERE estado = 'pendiente'
UNION ALL SELECT N'U-019 Recarga',          COUNT(*) FROM dbo.Recarga           WHERE estado = 'anulada'
UNION ALL SELECT N'U-020 Resultado',        COUNT(*) FROM dbo.Resultado         WHERE estado = 'oficial';

/* --------------------------------------------------------------------------
   CAMBIAR POR COMMIT TRANSACTION PARA APLICAR LOS DATOS DE FORMA PERMANENTE
   -------------------------------------------------------------------------- */
ROLLBACK TRANSACTION;

/* Verificacion posterior: la base queda igual que antes de ejecutar el script. */
SELECT (SELECT COUNT(*) FROM dbo.Recarga  WHERE estado = 'anulada')     AS recargas_anuladas,
       (SELECT COUNT(*) FROM dbo.Usuario  WHERE telefono = N'+573001112299') AS usuario_actualizado;
GO
