/* ============================================================================
   APUESTADB - consultas/02_insert.sql
   Entregable : 20 sentencias INSERT distintas (Fase 13).
   Motor      : SQL Server (T-SQL), base ApuestaDB.
   ----------------------------------------------------------------------------
   Reglas de este archivo:
     - 20 INSERT distintos: 20 tablas diferentes y 3 formas de insercion
       (VALUES, INSERT..SELECT con literales y INSERT..SELECT con subconsultas).
     - Todo el archivo es UNA transaccion que TERMINA EN ROLLBACK: se puede
       ejecutar cuantas veces se quiera sin alterar los datos de demostracion.
     - Para dejar los datos insertados de forma permanente, cambie la linea
       marcada "ROLLBACK TRANSACTION" por "COMMIT TRANSACTION".
     - La contrasena del usuario nuevo es un valor de relleno: NO es una
       credencial real (el alta real la hace usp_Usuario_Registrar).
   Uso: sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i 02_insert.sql
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

DECLARE @id_pais        INT,
        @id_ciudad      INT,
        @id_deporte     INT,
        @id_liga        INT,
        @id_temporada   INT,
        @id_estadio     INT,
        @id_arbitro     INT,
        @id_usuario     INT,
        @id_evento      INT,
        @id_mercado     INT,
        @id_tipo_saldo  INT,
        @id_saldo_cuenta INT;

/* ==========================================================================
   1. CATALOGO GEOGRAFICO Y DEPORTIVO
   ========================================================================== */

-- I-001 | Pais | Insercion directa con VALUES
INSERT INTO dbo.Pais (nombre, codigo)
VALUES (N'Islandia', 'IS');

-- I-002 | Ciudad | INSERT..SELECT de una fila dependiente del pais creado
INSERT INTO dbo.Ciudad (id_pais, nombre, region)
SELECT id_pais, N'Reikiavik', N'Hovedstaden'
FROM dbo.Pais
WHERE nombre = N'Islandia';

-- I-003 | Estadio | INSERT..SELECT con la ciudad y la capacidad
INSERT INTO dbo.Estadio (id_ciudad, nombre, capacidad, direccion)
SELECT c.id_ciudad, N'Laugardalsvollur', 15000, N'Reykjavik, Islandia'
FROM dbo.Ciudad c
WHERE c.nombre = N'Reikiavik';

-- I-004 | Deporte | Insercion directa de un deporte nuevo
INSERT INTO dbo.Deporte (nombre, descripcion, estado)
VALUES (N'Balonmano', N'Deporte de equipo con balon y porteria.', 'vigente');

-- I-005 | Liga | Liga asociada al deporte nuevo
INSERT INTO dbo.Liga (id_deporte, nombre, categoria, estado)
SELECT id_deporte, N'Liga Islandesa', N'Primera Division', 'vigente'
FROM dbo.Deporte
WHERE nombre = N'Balonmano';

-- I-006 | Temporada | Temporada de la liga nueva con fechas validas
INSERT INTO dbo.Temporada (id_liga, etiqueta, fecha_inicio, fecha_fin, estado)
SELECT l.id_liga, N'2026-27', CONVERT(DATE, '2026-09-01'), CONVERT(DATE, '2027-04-30'), 'en_curso'
FROM dbo.Liga l
WHERE l.nombre = N'Liga Islandesa';

-- I-007 | Equipo | Equipo local (subconsultas escalares para las claves)
INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
SELECT (SELECT id_deporte FROM dbo.Deporte WHERE nombre = N'Balonmano'),
       (SELECT id_ciudad  FROM dbo.Ciudad  WHERE nombre = N'Reikiavik'),
       N'KR Reikiavik', N'KRR', CONVERT(DATE, '1899-02-16'), 'vigente';

-- I-008 | Equipo | Equipo visitante del mismo deporte y ciudad
INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
SELECT (SELECT id_deporte FROM dbo.Deporte WHERE nombre = N'Balonmano'),
       (SELECT id_ciudad  FROM dbo.Ciudad  WHERE nombre = N'Reikiavik'),
       N'Valur Reikiavik', N'VAL', CONVERT(DATE, '1911-05-11'), 'vigente';

-- I-009 | Arbitro | Arbitro designado para el evento de prueba
INSERT INTO dbo.Arbitro (nombres, apellidos, categoria, estado)
VALUES (N'Gunnar', N'Sigurdsson', N'FIFA', 'vigente');

/* ==========================================================================
   2. SEGURIDAD Y USUARIOS
   ========================================================================== */

-- I-010 | Usuario | Alta de usuario con rol consultado por nombre
INSERT INTO dbo.Usuario (id_rol, nombres, apellidos, correo, contrasena, telefono, estado, fecha_registro)
SELECT (SELECT id_rol FROM dbo.Rol WHERE nombre = 'usuario'),
       N'Isabel', N'Thoroddsen', N'isabel.thoroddsen@apuestadb.co',
       'HASH_DE_RELLENO_NO_VERSIONADO', N'+3545550100', 'activo', SYSDATETIME();

-- I-011 | RespuestaSeguridad | Respuesta de seguridad del usuario nuevo
INSERT INTO dbo.RespuestaSeguridad (id_usuario, id_pregunta, respuesta, fecha_registro)
SELECT (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co'),
       (SELECT TOP (1) id_pregunta FROM dbo.PreguntaSeguridad ORDER BY id_pregunta),
       'Valur Reikiavik', SYSDATETIME();

-- I-012 | TokenRecuperacion | Token vigente con expiracion en 2 horas
INSERT INTO dbo.TokenRecuperacion (id_usuario, valor_token, fecha_emision, fecha_expiracion, estado)
SELECT (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co'),
       'borrador-token-001', SYSDATETIME(), DATEADD(HOUR, 2, SYSDATETIME()), 'vigente';

/* ==========================================================================
   3. EVENTO, MERCADO Y CUOTA
   ========================================================================== */

-- I-013 | Evento | Evento programado con los dos equipos y el estadio nuevos
INSERT INTO dbo.Evento (id_temporada, id_equipo_local, id_equipo_visitante, id_estadio,
                        fecha_hora_inicio, estado, descripcion)
SELECT (SELECT t.id_temporada FROM dbo.Temporada t
        WHERE t.id_liga = (SELECT id_liga FROM dbo.Liga WHERE nombre = N'Liga Islandesa')),
       (SELECT id_equipo FROM dbo.Equipo WHERE nombre = N'KR Reikiavik'),
       (SELECT id_equipo FROM dbo.Equipo WHERE nombre = N'Valur Reikiavik'),
       (SELECT id_estadio FROM dbo.Estadio WHERE nombre = N'Laugardalsvollur'),
       CONVERT(DATETIME2(3), '2026-10-15T19:00:00'), 'programado', N'Final de la Liga Islandesa (demo Fase 13)';

-- I-014 | CalendarioArbitro | Designacion del arbitro para el evento creado
INSERT INTO dbo.CalendarioArbitro (id_evento, id_arbitro, rol_arbitro, fecha_designacion)
SELECT (SELECT id_evento FROM dbo.Evento WHERE descripcion = N'Final de la Liga Islandesa (demo Fase 13)'),
       (SELECT id_arbitro FROM dbo.Arbitro WHERE apellidos = N'Sigurdsson'),
       'principal', SYSDATETIME();

-- I-015 | Mercado | Mercado abierto con cierre a 10 dias
INSERT INTO dbo.Mercado (id_evento, nombre, descripcion, fecha_apertura, fecha_cierre, estado)
SELECT e.id_evento, N'Resultado final', N'Ganador del partido: local, empate o visitante.',
       SYSDATETIME(), DATEADD(DAY, 10, SYSDATETIME()), 'abierto'
FROM dbo.Evento e
WHERE e.descripcion = N'Final de la Liga Islandesa (demo Fase 13)';

-- I-016 | OpcionApuesta | Opcion 'local' del mercado (el trigger registra el historial de cuota)
INSERT INTO dbo.OpcionApuesta (id_mercado, etiqueta, cuota_vigente, estado)
SELECT (SELECT m.id_mercado FROM dbo.Mercado m
        WHERE m.id_evento = (SELECT id_evento FROM dbo.Evento
                             WHERE descripcion = N'Final de la Liga Islandesa (demo Fase 13)')),
       'local', CAST(1.90 AS DECIMAL(10,2)), 'habilitada';

/* ==========================================================================
   4. SALDO FICTICIO Y APUESTA (sin dinero real)
   ========================================================================== */

-- I-017 | SaldoCuenta | Cuenta de tokens en cero para el usuario nuevo
INSERT INTO dbo.SaldoCuenta (id_usuario, id_tipo_saldo, saldo_actual, fecha_ultima_actualizacion)
SELECT (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co'),
       (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens'),
       0, SYSDATETIME();

-- I-018 | Recarga | Recarga de saldo ficticio por 100000 tokens
INSERT INTO dbo.Recarga (id_usuario, id_tipo_saldo, monto, fecha_hora, estado, observacion)
SELECT (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co'),
       (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens'),
       CAST(100000.00 AS DECIMAL(18,2)), SYSDATETIME(), 'aplicada', N'DEMO Fase 13 - recarga de prueba';

-- I-019 | Apuesta | Apuesta simple con la cuota vigente congelada
INSERT INTO dbo.Apuesta (id_usuario, id_opcion, id_tipo_saldo, monto, cuota_congelada,
                         tipo_apuesta, estado, fecha_hora_registro)
SELECT (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co'),
       (SELECT o.id_opcion FROM dbo.OpcionApuesta o
        WHERE o.id_mercado = (SELECT m.id_mercado FROM dbo.Mercado m
                              WHERE m.id_evento = (SELECT id_evento FROM dbo.Evento
                                                   WHERE descripcion = N'Final de la Liga Islandesa (demo Fase 13)'))),
       (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens'),
       CAST(25000.00 AS DECIMAL(18,2)),
       (SELECT o.cuota_vigente FROM dbo.OpcionApuesta o
        WHERE o.id_mercado = (SELECT m.id_mercado FROM dbo.Mercado m
                              WHERE m.id_evento = (SELECT id_evento FROM dbo.Evento
                                                   WHERE descripcion = N'Final de la Liga Islandesa (demo Fase 13)'))
          AND o.etiqueta = 'local'),
       'simple', 'pendiente', SYSDATETIME();

-- I-020 | MovimientoSaldo | Debito por la apuesta (el trigger sincroniza el saldo consolidado)
INSERT INTO dbo.MovimientoSaldo (id_saldo_cuenta, id_tipo_movimiento, id_apuesta, id_recarga,
                                 monto, saldo_resultante, fecha_hora, referencia)
SELECT (SELECT sc.id_saldo_cuenta FROM dbo.SaldoCuenta sc
        WHERE sc.id_usuario = (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co')
          AND sc.id_tipo_saldo = (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens')),
       (SELECT id_tipo_movimiento FROM dbo.TipoMovimientoSaldo WHERE nombre = 'apuesta'),
       a.id_apuesta, NULL, a.monto, 75000.00, SYSDATETIME(),
       N'Descuento por registro de apuesta - DEMO Fase 13'
FROM dbo.Apuesta a
WHERE a.id_usuario = (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co');

/* Verificacion dentro de la transaccion: los 20 INSERT existen. */
SELECT N'Usuario nuevo'          AS concepto, COUNT(*) AS filas FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co'
UNION ALL SELECT N'Pais nuevo',              COUNT(*) FROM dbo.Pais               WHERE nombre = N'Islandia'
UNION ALL SELECT N'Equipos nuevos',          COUNT(*) FROM dbo.Equipo             WHERE nombre LIKE N'%Reikiavik'
UNION ALL SELECT N'Evento nuevo',            COUNT(*) FROM dbo.Evento             WHERE descripcion LIKE N'Final de la Liga Islandesa%'
UNION ALL SELECT N'Apuesta nueva',           COUNT(*) FROM dbo.Apuesta            WHERE monto = 25000.00
UNION ALL SELECT N'Movimiento nuevo',        COUNT(*) FROM dbo.MovimientoSaldo    WHERE referencia LIKE N'%Fase 13%';

/* --------------------------------------------------------------------------
   CAMBIAR POR COMMIT TRANSACTION PARA APLICAR LOS DATOS DE FORMA PERMANENTE
   -------------------------------------------------------------------------- */
ROLLBACK TRANSACTION;

/* Verificacion posterior: la base queda igual que antes de ejecutar el script. */
SELECT (SELECT COUNT(*) FROM dbo.Usuario WHERE correo = N'isabel.thoroddsen@apuestadb.co') AS usuario_persistido,
       (SELECT COUNT(*) FROM dbo.Pais    WHERE nombre = N'Islandia')                       AS pais_persistido;
GO
