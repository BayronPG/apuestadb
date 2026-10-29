/* ============================================================================
   APUESTADB - 04_indexes.sql
   Objetivo : Crear los indices non-clustered de apoyo (FK y consultas).
   Notas    :
   - Los indices CLUSTERED de las PK y los UNIQUE ya se crearon en 03_constraints.sql.
   - Se evita duplicar indices: donde una restriccion UNIQUE ya empieza por la
     columna de la FK, no se crea un indice adicional.
   Requiere : 01, 02 y 03 ejecutados.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* Las opciones SET son obligatorias para crear un indice filtrado
   (UX_Usuario_telefono). sqlcmd las desactiva por defecto; con estas lineas el
   script funciona igual desde SSMS y desde sqlcmd (sin requerir -I). */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/* --- Seguridad y usuarios -------------------------------------------------- */
CREATE INDEX IX_Usuario_Rol               ON dbo.Usuario (id_rol);
CREATE INDEX IX_Respuesta_Pregunta        ON dbo.RespuestaSeguridad (id_pregunta);
CREATE INDEX IX_Token_Usuario             ON dbo.TokenRecuperacion (id_usuario);
GO

/* --- Catalogo deportivo ---------------------------------------------------- */
CREATE INDEX IX_Equipo_Ciudad             ON dbo.Equipo (id_ciudad);
CREATE INDEX IX_Evento_EquipoLocal        ON dbo.Evento (id_equipo_local);
CREATE INDEX IX_Evento_EquipoVisitante    ON dbo.Evento (id_equipo_visitante);
CREATE INDEX IX_Evento_Estadio            ON dbo.Evento (id_estadio);
CREATE INDEX IX_Evento_Estado_Fecha       ON dbo.Evento (estado, fecha_hora_inicio)
    INCLUDE (id_estadio, id_equipo_local, id_equipo_visitante);
CREATE INDEX IX_Calendario_Arbitro        ON dbo.CalendarioArbitro (id_arbitro);
GO

/* --- Apuestas -------------------------------------------------------------- */
CREATE INDEX IX_Apuesta_Usuario           ON dbo.Apuesta (id_usuario, estado)
    INCLUDE (monto, cuota_congelada, fecha_hora_registro);
CREATE INDEX IX_Apuesta_OpcionEstado      ON dbo.Apuesta (id_opcion, estado);
CREATE INDEX IX_Apuesta_TipoSaldo         ON dbo.Apuesta (id_tipo_saldo);
CREATE INDEX IX_Favorito_Equipo           ON dbo.FavoritoEquipo (id_equipo);
GO

/* --- Saldo ficticio -------------------------------------------------------- */
CREATE INDEX IX_SaldoCuenta_TipoSaldo     ON dbo.SaldoCuenta (id_tipo_saldo);
CREATE INDEX IX_Movimiento_SaldoCuenta    ON dbo.MovimientoSaldo (id_saldo_cuenta, fecha_hora DESC);
CREATE INDEX IX_Movimiento_TipoMovimiento ON dbo.MovimientoSaldo (id_tipo_movimiento);
CREATE INDEX IX_Movimiento_Apuesta        ON dbo.MovimientoSaldo (id_apuesta);
CREATE INDEX IX_Movimiento_Recarga        ON dbo.MovimientoSaldo (id_recarga);
CREATE INDEX IX_Recarga_UsuarioFecha      ON dbo.Recarga (id_usuario, fecha_hora DESC);
CREATE INDEX IX_Recarga_TipoSaldo         ON dbo.Recarga (id_tipo_saldo);
GO

/* --- Resultados y liquidacion ---------------------------------------------- */
CREATE INDEX IX_Liquidacion_Resultado     ON dbo.Liquidacion (id_resultado);
GO

/* --- Auditoria y soporte ---------------------------------------------------- */
CREATE INDEX IX_Notificacion_Usuario      ON dbo.Notificacion (id_usuario, estado);
CREATE INDEX IX_Auditoria_Usuario         ON dbo.Auditoria (id_usuario);
CREATE INDEX IX_Auditoria_Fecha           ON dbo.Auditoria (fecha_hora DESC);
CREATE INDEX IX_Auditoria_Entidad         ON dbo.Auditoria (entidad_afectada);
GO

/* --- Indice unico filtrado (telefono opcional unico) ------------------------ */
CREATE UNIQUE INDEX UX_Usuario_telefono   ON dbo.Usuario (telefono)
    WHERE telefono IS NOT NULL;
GO

PRINT 'Indices non-clustered creados (25 + 1 filtrado unico).';
GO
