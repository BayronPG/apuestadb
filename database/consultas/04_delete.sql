/* ============================================================================
   APUESTADB - consultas/04_delete.sql
   Entregable : 20 sentencias DELETE distintas (Fase 13).
   Motor      : SQL Server (T-SQL), base ApuestaDB.
   ----------------------------------------------------------------------------
   Reglas de este archivo:
     - 20 DELETE distintos: 20 tablas diferentes, distintas formas de filtro
       (por clave, por patron LIKE, por IN, por EXISTS, por subconsulta, con TOP
       y con NOT EXISTS) y en orden seguro respecto a las llaves foraneas.
     - TABLAS NO BORRABLES POR DISENO (se respetan): MovimientoSaldo,
       HistorialCuota, Liquidacion y SaldoCuenta son inmutables/criticas para los
       triggers del modelo; por eso el script NO intenta borrarlas.
     - El bloque de AMBIENTACION (abajo) crea filas desechables con la etiqueta
       "BORRADOR"; NO forma parte del conteo de las 20 sentencias DELETE.
     - Todo el archivo es UNA transaccion que TERMINA EN ROLLBACK.
     - Para aplicar los borrados de forma permanente, cambie ROLLBACK por COMMIT.
   Uso: sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i 04_delete.sql
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

/* ==========================================================================
   AMBIENTACION (no cuenta como sentencia DELETE)
   Crea un escenario aislado identificable con la palabra BORRADOR.
   ========================================================================== */
DECLARE @id_pais INT, @id_ciudad INT, @id_estadio INT, @id_deporte INT, @id_liga INT,
        @id_temporada INT, @id_equipo_a INT, @id_equipo_b INT, @id_arbitro INT,
        @id_evento INT, @id_mercado INT, @id_usuario INT;

INSERT INTO dbo.Pais (nombre, codigo) VALUES (N'Borraduria', 'ZZ');
SET @id_pais = SCOPE_IDENTITY();

INSERT INTO dbo.Ciudad (id_pais, nombre, region) VALUES (@id_pais, N'Ciudad Borrador', N'Region Borrador');
SET @id_ciudad = SCOPE_IDENTITY();

INSERT INTO dbo.Estadio (id_ciudad, nombre, capacidad, direccion)
VALUES (@id_ciudad, N'Estadio Borrador', 1000, N'Calle Borrador 1');
SET @id_estadio = SCOPE_IDENTITY();

INSERT INTO dbo.Deporte (nombre, descripcion, estado)
VALUES (N'Deporte Borrador', N'Deporte creado solo para probar borrados.', 'inactivo');
SET @id_deporte = SCOPE_IDENTITY();

INSERT INTO dbo.Liga (id_deporte, nombre, categoria, estado)
VALUES (@id_deporte, N'Liga Borrador', N'Categoria Borrador', 'inactivo');
SET @id_liga = SCOPE_IDENTITY();

INSERT INTO dbo.Temporada (id_liga, etiqueta, fecha_inicio, fecha_fin, estado)
VALUES (@id_liga, N'2099-I', CONVERT(DATE, '2099-01-01'), CONVERT(DATE, '2099-06-30'), 'finalizada');
SET @id_temporada = SCOPE_IDENTITY();

INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
VALUES (@id_deporte, @id_ciudad, N'Equipo Borrador A', N'EBA', CONVERT(DATE, '2000-01-01'), 'inactivo');
SET @id_equipo_a = SCOPE_IDENTITY();

INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
VALUES (@id_deporte, @id_ciudad, N'Equipo Borrador B', N'EBB', CONVERT(DATE, '2001-01-01'), 'inactivo');
SET @id_equipo_b = SCOPE_IDENTITY();

INSERT INTO dbo.Arbitro (nombres, apellidos, categoria, estado)
VALUES (N'Arbitro', N'Borrador', N'Nacional', 'inactivo');
SET @id_arbitro = SCOPE_IDENTITY();

INSERT INTO dbo.Evento (id_temporada, id_equipo_local, id_equipo_visitante, id_estadio,
                        fecha_hora_inicio, estado, descripcion)
VALUES (@id_temporada, @id_equipo_a, @id_equipo_b, @id_estadio,
        CONVERT(DATETIME2(3), '2099-01-15T19:00:00'), 'finalizado', N'Evento Borrador Fase 13');
SET @id_evento = SCOPE_IDENTITY();

INSERT INTO dbo.CalendarioArbitro (id_evento, id_arbitro, rol_arbitro, fecha_designacion)
VALUES (@id_evento, @id_arbitro, 'principal', SYSDATETIME());

INSERT INTO dbo.Mercado (id_evento, nombre, descripcion, fecha_apertura, fecha_cierre, estado)
VALUES (@id_evento, N'Mercado Borrador', N'Mercado sin opciones para probar el borrado.',
        CONVERT(DATETIME2(3), '2099-01-14T08:00:00'), CONVERT(DATETIME2(3), '2099-01-15T18:55:00'), 'cerrado');
SET @id_mercado = SCOPE_IDENTITY();

INSERT INTO dbo.Resultado (id_evento, marcador_local, marcador_visitante, fecha_registro, estado)
VALUES (@id_evento, 1, 0, SYSDATETIME(), 'provisional');

INSERT INTO dbo.Usuario (id_rol, nombres, apellidos, correo, contrasena, telefono, estado, fecha_registro)
VALUES ((SELECT id_rol FROM dbo.Rol WHERE nombre = 'usuario'),
        N'Boris', N'Borrador', N'borrador.delete@apuestadb.co',
        'HASH_DE_RELLENO_NO_VERSIONADO', N'+570000000000', 'activo', SYSDATETIME());
SET @id_usuario = SCOPE_IDENTITY();

INSERT INTO dbo.RespuestaSeguridad (id_usuario, id_pregunta, respuesta, fecha_registro)
VALUES (@id_usuario, (SELECT TOP (1) id_pregunta FROM dbo.PreguntaSeguridad ORDER BY id_pregunta),
        'Borrador', SYSDATETIME());

INSERT INTO dbo.TokenRecuperacion (id_usuario, valor_token, fecha_emision, fecha_expiracion, estado)
VALUES (@id_usuario, 'borrador-token-delete', SYSDATETIME(), DATEADD(HOUR, 1, SYSDATETIME()), 'vigente');

INSERT INTO dbo.FavoritoEquipo (id_usuario, id_equipo, fecha_marcado)
VALUES (@id_usuario, @id_equipo_a, SYSDATETIME());

INSERT INTO dbo.Notificacion (id_usuario, mensaje, tipo, fecha_hora, estado)
VALUES (@id_usuario, N'BORRADOR Fase 13 - notificacion de prueba', N'prueba', SYSDATETIME(), 'no_leida');

INSERT INTO dbo.Recarga (id_usuario, id_tipo_saldo, monto, fecha_hora, estado, observacion)
VALUES (@id_usuario, (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens'),
        CAST(10000.00 AS DECIMAL(18,2)), SYSDATETIME(), 'aplicada', N'BORRADOR Fase 13 - recarga de prueba');

INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
VALUES (@id_usuario, N'Prueba de borrado', N'Notificacion', N'BORRADOR Fase 13 - registro de auditoria',
        SYSDATETIME(), 'exito', '127.0.0.1');

/* ==========================================================================
   LAS 20 SENTENCIAS DELETE (dependencias de hijo a padre)
   ========================================================================== */

-- D-001 | Notificacion | Borrado por usuario y tipo
DELETE FROM dbo.Notificacion
WHERE id_usuario = @id_usuario
  AND tipo = N'prueba';

-- D-002 | Auditoria | Borrado por patron de descripcion
DELETE FROM dbo.Auditoria
WHERE descripcion LIKE N'BORRADOR%';

-- D-003 | FavoritoEquipo | Borrado con subconsulta por correo
DELETE FROM dbo.FavoritoEquipo
WHERE id_usuario IN (SELECT id_usuario FROM dbo.Usuario WHERE correo = N'borrador.delete@apuestadb.co');

-- D-004 | TokenRecuperacion | Borrado por valor de token y estado
DELETE FROM dbo.TokenRecuperacion
WHERE valor_token = N'borrador-token-delete'
  AND estado = 'vigente';

-- D-005 | RespuestaSeguridad | Borrado con subconsulta correlacionada (EXISTS)
DELETE FROM dbo.RespuestaSeguridad
WHERE EXISTS (SELECT 1
              FROM dbo.Usuario u
              WHERE u.id_usuario = dbo.RespuestaSeguridad.id_usuario
                AND u.correo = N'borrador.delete@apuestadb.co');

-- D-006 | Recarga | Borrado por patron de observacion
DELETE FROM dbo.Recarga
WHERE observacion LIKE N'BORRADOR%';

-- D-007 | Resultado | Borrado de un resultado provisional sin liquidaciones (NOT EXISTS)
DELETE FROM dbo.Resultado
WHERE id_evento = @id_evento
  AND estado = 'provisional'
  AND NOT EXISTS (SELECT 1 FROM dbo.Liquidacion l WHERE l.id_resultado = dbo.Resultado.id_resultado);

-- D-008 | CalendarioArbitro | Borrado de las designaciones del evento
DELETE FROM dbo.CalendarioArbitro
WHERE id_evento = @id_evento;

-- D-009 | Mercado | Borrado del mercado sin opciones
DELETE FROM dbo.Mercado
WHERE nombre = N'Mercado Borrador'
  AND id_evento = @id_evento;

-- D-010 | Evento | Borrado del evento y de su calendario asociado
DELETE FROM dbo.Evento
WHERE descripcion LIKE N'Evento Borrador%';

-- D-011 | Temporada | Borrado de la temporada de prueba
DELETE FROM dbo.Temporada
WHERE etiqueta = N'2099-I';

-- D-012 | Equipo | Borrado de una sola fila con TOP
DELETE TOP (1) FROM dbo.Equipo
WHERE siglas = N'EBB';

-- D-013 | Equipo | Borrado del equipo restante por lista de siglas
DELETE FROM dbo.Equipo
WHERE siglas IN (N'EBA');

-- D-014 | Arbitro | Borrado por apellido
DELETE FROM dbo.Arbitro
WHERE apellidos = N'Borrador';

-- D-015 | Estadio | Borrado por nombre del escenario
DELETE FROM dbo.Estadio
WHERE nombre = N'Estadio Borrador';

-- D-016 | Ciudad | Borrado por region
DELETE FROM dbo.Ciudad
WHERE region = N'Region Borrador';

-- D-017 | Pais | Borrado por codigo ISO
DELETE FROM dbo.Pais
WHERE codigo = N'ZZ';

-- D-018 | Liga | Borrado por nombre
DELETE FROM dbo.Liga
WHERE nombre = N'Liga Borrador';

-- D-019 | Deporte | Borrado por nombre del deporte
DELETE FROM dbo.Deporte
WHERE nombre = N'Deporte Borrador';

-- D-020 | Usuario | Borrado del usuario de prueba (ultimo por las FK)
DELETE FROM dbo.Usuario
WHERE correo = N'borrador.delete@apuestadb.co';

/* Verificacion dentro de la transaccion: no queda ningun registro BORRADOR. */
SELECT N'Borraduria'            AS entidad, COUNT(*) AS restantes FROM dbo.Pais             WHERE nombre = N'Borraduria'
UNION ALL SELECT N'Ciudad Borrador',        COUNT(*) FROM dbo.Ciudad             WHERE nombre = N'Ciudad Borrador'
UNION ALL SELECT N'Estadio Borrador',       COUNT(*) FROM dbo.Estadio            WHERE nombre = N'Estadio Borrador'
UNION ALL SELECT N'Deporte Borrador',       COUNT(*) FROM dbo.Deporte            WHERE nombre = N'Deporte Borrador'
UNION ALL SELECT N'Liga Borrador',          COUNT(*) FROM dbo.Liga               WHERE nombre = N'Liga Borrador'
UNION ALL SELECT N'Temporada 2099-I',       COUNT(*) FROM dbo.Temporada          WHERE etiqueta = N'2099-I'
UNION ALL SELECT N'Equipos Borrador',       COUNT(*) FROM dbo.Equipo             WHERE nombre LIKE N'Equipo Borrador%'
UNION ALL SELECT N'Arbitro Borrador',       COUNT(*) FROM dbo.Arbitro            WHERE apellidos = N'Borrador'
UNION ALL SELECT N'Evento Borrador',        COUNT(*) FROM dbo.Evento             WHERE descripcion LIKE N'Evento Borrador%'
UNION ALL SELECT N'Mercado Borrador',       COUNT(*) FROM dbo.Mercado            WHERE nombre = N'Mercado Borrador'
UNION ALL SELECT N'Usuario Borrador',       COUNT(*) FROM dbo.Usuario            WHERE correo = N'borrador.delete@apuestadb.co'
UNION ALL SELECT N'Auditoria BORRADOR',     COUNT(*) FROM dbo.Auditoria          WHERE descripcion LIKE N'BORRADOR%';

/* --------------------------------------------------------------------------
   CAMBIAR POR COMMIT TRANSACTION PARA APLICAR LOS BORRADOS DE FORMA PERMANENTE
   -------------------------------------------------------------------------- */
ROLLBACK TRANSACTION;
GO
