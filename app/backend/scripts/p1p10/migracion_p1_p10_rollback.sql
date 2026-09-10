/* ============================================================================
   ROLLBACK de la migracion P1-P10 (reversible por pasos, en orden inverso).
   Restauracion completa alternativa: restaurar el backup
   app/backend/backups/ApuestaDB_bak_20260909_1917.bak
   ============================================================================ */
USE ApuestaDB;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- P10: retirar la restriccion compuesta
IF EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_Usuario_TipoNumeroDoc' AND type = 'UQ')
    ALTER TABLE dbo.Usuario DROP CONSTRAINT UQ_Usuario_TipoNumeroDoc;
GO

-- P9: restaurar el CHECK original (con LOGIN) y el registro historico retirado
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Auditoria_Operacion' AND parent_object_id = OBJECT_ID('dbo.Auditoria'))
    ALTER TABLE dbo.Auditoria DROP CONSTRAINT CK_Auditoria_Operacion;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK__Auditoria__opera__28ED12D1' AND parent_object_id = OBJECT_ID('dbo.Auditoria'))
    ALTER TABLE dbo.Auditoria ADD CONSTRAINT CK__Auditoria__opera__28ED12D1
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN'));
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Auditoria WHERE id = 1 AND operacion = 'LOGIN')
    SET IDENTITY_INSERT dbo.Auditoria ON;
    INSERT INTO dbo.Auditoria (id, usuario_id, tabla_afectada, operacion, detalle, fecha)
    VALUES (1, 1, 'Login', 'LOGIN', 'Inicio de sesion exitoso', '2026-09-02 10:00:00');
    SET IDENTITY_INSERT dbo.Auditoria OFF;
GO

-- P8: retirar empresa_id de Servicios y Reglas
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Servicios_Empresa')
    ALTER TABLE dbo.Servicios DROP CONSTRAINT FK_Servicios_Empresa;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Reglas_Empresa')
    ALTER TABLE dbo.Reglas DROP CONSTRAINT FK_Reglas_Empresa;
GO
IF COL_LENGTH('dbo.Servicios', 'empresa_id') IS NOT NULL
    ALTER TABLE dbo.Servicios DROP COLUMN empresa_id;
IF COL_LENGTH('dbo.Reglas', 'empresa_id') IS NOT NULL
    ALTER TABLE dbo.Reglas DROP COLUMN empresa_id;
GO

-- P7: retirar trazabilidad de Notificacion
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Notificacion_OrigenUnico' AND parent_object_id = OBJECT_ID('dbo.Notificacion'))
    ALTER TABLE dbo.Notificacion DROP CONSTRAINT CK_Notificacion_OrigenUnico;
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Notificacion_HacerApuesta')
    ALTER TABLE dbo.Notificacion DROP CONSTRAINT FK_Notificacion_HacerApuesta;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Notificacion_Recarga')
    ALTER TABLE dbo.Notificacion DROP CONSTRAINT FK_Notificacion_Recarga;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_HacerApuesta' AND object_id = OBJECT_ID('dbo.Notificacion'))
    DROP INDEX IX_Notificacion_HacerApuesta ON dbo.Notificacion;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_Recarga' AND object_id = OBJECT_ID('dbo.Notificacion'))
    DROP INDEX IX_Notificacion_Recarga ON dbo.Notificacion;
GO
IF COL_LENGTH('dbo.Notificacion', 'hacer_apuesta_id') IS NOT NULL
    ALTER TABLE dbo.Notificacion DROP COLUMN hacer_apuesta_id;
IF COL_LENGTH('dbo.Notificacion', 'recarga_id') IS NOT NULL
    ALTER TABLE dbo.Notificacion DROP COLUMN recarga_id;
GO

-- P6: retirar vinculo LogPago -> Recarga
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_LogPago_Recarga' AND object_id = OBJECT_ID('dbo.LogPago'))
    DROP INDEX UQ_LogPago_Recarga ON dbo.LogPago;
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_LogPago_Recarga')
    ALTER TABLE dbo.LogPago DROP CONSTRAINT FK_LogPago_Recarga;
GO
IF COL_LENGTH('dbo.LogPago', 'recarga_id') IS NOT NULL
    ALTER TABLE dbo.LogPago DROP COLUMN recarga_id;
GO

-- P5: retirar Liga -> Pais (la columna texto Liga.pais nunca se elimino)
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Liga_Pais')
    ALTER TABLE dbo.Liga DROP CONSTRAINT FK_Liga_Pais;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Liga_Pais' AND object_id = OBJECT_ID('dbo.Liga'))
    DROP INDEX IX_Liga_Pais ON dbo.Liga;
GO
IF COL_LENGTH('dbo.Liga', 'pais_id') IS NOT NULL
    ALTER TABLE dbo.Liga DROP COLUMN pais_id;
GO
-- El Pais 'Internacional' creado por la migracion se conserva solo si ninguna
-- liga lo referencia (tras el paso anterior ya no) y no existia antes:
IF NOT EXISTS (SELECT 1 FROM dbo.Liga WHERE pais_id = 6)
   AND EXISTS (SELECT 1 FROM dbo.Pais WHERE id = 6 AND nombre = 'Internacional')
    DELETE FROM dbo.Pais WHERE id = 6;
GO

-- P3/P4: retirar Temporada.liga_id y Calendario.temporada_id/estadio_id
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Temporada_Liga')
    ALTER TABLE dbo.Temporada DROP CONSTRAINT FK_Temporada_Liga;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Calendario_Temporada')
    ALTER TABLE dbo.Calendario DROP CONSTRAINT FK_Calendario_Temporada;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Calendario_Estadio')
    ALTER TABLE dbo.Calendario DROP CONSTRAINT FK_Calendario_Estadio;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Equipo_Estadio')
    ALTER TABLE dbo.Equipo DROP CONSTRAINT FK_Equipo_Estadio;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Temporada_Liga' AND object_id = OBJECT_ID('dbo.Temporada'))
    DROP INDEX IX_Temporada_Liga ON dbo.Temporada;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Calendario_Estadio' AND object_id = OBJECT_ID('dbo.Calendario'))
    DROP INDEX IX_Calendario_Estadio ON dbo.Calendario;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Calendario_Temporada' AND object_id = OBJECT_ID('dbo.Calendario'))
    DROP INDEX IX_Calendario_Temporada ON dbo.Calendario;
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Equipo_Estadio' AND object_id = OBJECT_ID('dbo.Equipo'))
    DROP INDEX IX_Equipo_Estadio ON dbo.Equipo;
GO
IF COL_LENGTH('dbo.Temporada', 'liga_id') IS NOT NULL
    ALTER TABLE dbo.Temporada DROP COLUMN liga_id;
IF COL_LENGTH('dbo.Calendario', 'temporada_id') IS NOT NULL
    ALTER TABLE dbo.Calendario DROP COLUMN temporada_id;
IF COL_LENGTH('dbo.Calendario', 'estadio_id') IS NOT NULL
    ALTER TABLE dbo.Calendario DROP COLUMN estadio_id;
IF COL_LENGTH('dbo.Equipo', 'estadio_id') IS NOT NULL
    ALTER TABLE dbo.Equipo DROP COLUMN estadio_id;
GO

PRINT 'Rollback P1-P10 ejecutado.';
GO
