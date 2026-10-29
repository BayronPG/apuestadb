/* ============================================================================
   APUESTADB - 05_seed_data.sql
   Objetivo : Datos minimos de arranque (catalogos base).
   Requiere : 01, 02, 03 y 04 ejecutados.
   ----------------------------------------------------------------------------
   NOTA SOBRE "ESTADOS BASICOS":
   Los estados NO son una tabla catalogo en este modelo: se modelaron como
   dominios cerrados validados con restricciones CHECK (ver 03_constraints.sql).
   Por eso no hay filas que insertar para "estados"; su validez la garantiza
   el motor. Ejemplos de dominios ya activos:
     - Rol.estado                 : 'vigente' | 'inactivo'
     - Usuario.estado             : 'activo'  | 'inhabilitado'
     - Evento.estado              : 'programado' | 'en_curso' | 'finalizado' | 'cancelado' | 'suspendido'
     - Apuesta.estado             : 'pendiente' | 'ganada' | 'perdida' | 'anulada'
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* --------------------------------------------------------------------------
   1. Roles
   -------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Rol)
BEGIN
    INSERT INTO dbo.Rol (nombre, descripcion, estado) VALUES
        ('usuario',       'Usuario apostador del sistema.',        'vigente'),
        ('administrador', 'Usuario con funciones administrativas.', 'vigente');
END
GO

/* --------------------------------------------------------------------------
   2. Deportes (alcance inicial: futbol)
   -------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Deporte)
BEGIN
    INSERT INTO dbo.Deporte (nombre, descripcion, estado) VALUES
        ('Futbol', 'Deporte inicial del proyecto.', 'vigente');
END
GO

/* --------------------------------------------------------------------------
   3. Tipos de saldo (ficticios)
   -------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.TipoSaldo)
BEGIN
    INSERT INTO dbo.TipoSaldo (nombre, descripcion, estado) VALUES
        ('tokens', 'Saldo ficticio en tokens.', 'vigente'),
        ('PSE',    'Saldo ficticio por PSE.',   'vigente');
END
GO

/* --------------------------------------------------------------------------
   4. Tipos de movimiento de saldo
   -------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMovimientoSaldo)
BEGIN
    INSERT INTO dbo.TipoMovimientoSaldo (nombre, naturaleza, descripcion) VALUES
        ('apuesta', 'debito',  'Descuento del saldo por registro de apuesta.'),
        ('premio',  'credito', 'Abono del premio de una apuesta ganada.'),
        ('recarga', 'credito', 'Ingreso de saldo ficticio por recarga.'),
        ('ajuste',  'credito', 'Ajuste administrativo del saldo.');
END
GO

/* --------------------------------------------------------------------------
   5. Verificacion
   -------------------------------------------------------------------------- */
SELECT 'Rol' AS tabla, COUNT(*) AS filas FROM dbo.Rol
UNION ALL SELECT 'Deporte', COUNT(*) FROM dbo.Deporte
UNION ALL SELECT 'TipoSaldo', COUNT(*) FROM dbo.TipoSaldo
UNION ALL SELECT 'TipoMovimientoSaldo', COUNT(*) FROM dbo.TipoMovimientoSaldo;
GO

PRINT 'Datos minimos de arranque cargados.';
GO
