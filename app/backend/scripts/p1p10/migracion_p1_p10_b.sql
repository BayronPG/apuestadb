/* Parte B de la migracion P1-P10 (la parte A aplico P1-P5 y la columna/FK de P6;
   la UQ unica de LogPago fallo por multiples NULL, corregida con indice filtrado). */
USE ApuestaDB;
GO
-- Requerido por el indice filtrado (sqlcmd inicia con QUOTED_IDENTIFIER OFF)
SET QUOTED_IDENTIFIER ON;
GO

-- ===== P6 (correccion): indice unico filtrado (permite multiples NULL) =====
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_LogPago_Recarga' AND object_id = OBJECT_ID('dbo.LogPago'))
    DROP INDEX UQ_LogPago_Recarga ON dbo.LogPago;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_LogPago_Recarga' AND object_id = OBJECT_ID('dbo.LogPago'))
    CREATE UNIQUE INDEX UQ_LogPago_Recarga ON dbo.LogPago(recarga_id) WHERE recarga_id IS NOT NULL;
GO

-- P6 backfill
UPDATE lp SET recarga_id = r.id
FROM dbo.LogPago lp
JOIN dbo.Recarga r
  ON r.usuario_id = lp.usuario_id
 AND r.tipo_saldo_id = lp.tipo_saldo_id
 AND r.monto = lp.monto
 AND r.estado = 'aprobada'
WHERE lp.tipo = 'recarga' AND lp.recarga_id IS NULL;
GO

-- ===== P7: Notificacion -> HacerApuesta / Recarga =====
IF COL_LENGTH('dbo.Notificacion', 'hacer_apuesta_id') IS NULL
    ALTER TABLE dbo.Notificacion ADD hacer_apuesta_id INT NULL;
GO
IF COL_LENGTH('dbo.Notificacion', 'recarga_id') IS NULL
    ALTER TABLE dbo.Notificacion ADD recarga_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Notificacion_HacerApuesta')
    ALTER TABLE dbo.Notificacion ADD CONSTRAINT FK_Notificacion_HacerApuesta
        FOREIGN KEY (hacer_apuesta_id) REFERENCES dbo.HacerApuesta(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Notificacion_Recarga')
    ALTER TABLE dbo.Notificacion ADD CONSTRAINT FK_Notificacion_Recarga
        FOREIGN KEY (recarga_id) REFERENCES dbo.Recarga(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Notificacion_OrigenUnico' AND parent_object_id = OBJECT_ID('dbo.Notificacion'))
    ALTER TABLE dbo.Notificacion ADD CONSTRAINT CK_Notificacion_OrigenUnico
        CHECK (hacer_apuesta_id IS NULL OR recarga_id IS NULL);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_HacerApuesta' AND object_id = OBJECT_ID('dbo.Notificacion'))
    CREATE INDEX IX_Notificacion_HacerApuesta ON dbo.Notificacion(hacer_apuesta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_Recarga' AND object_id = OBJECT_ID('dbo.Notificacion'))
    CREATE INDEX IX_Notificacion_Recarga ON dbo.Notificacion(recarga_id);
GO
UPDATE n SET hacer_apuesta_id = ha.id
FROM dbo.Notificacion n
JOIN dbo.HacerApuesta ha ON ha.usuario_id = n.usuario_id AND ha.fecha < n.fecha
WHERE n.hacer_apuesta_id IS NULL
  AND n.tipo IN ('resultado', 'apuesta')
  AND ha.id = (SELECT TOP 1 h2.id FROM dbo.HacerApuesta h2
               WHERE h2.usuario_id = n.usuario_id AND h2.fecha < n.fecha
               ORDER BY h2.fecha DESC);
GO

-- ===== P8: Empresa/Servicios/Reglas =====
IF COL_LENGTH('dbo.Servicios', 'empresa_id') IS NULL
    ALTER TABLE dbo.Servicios ADD empresa_id INT NULL;
GO
IF COL_LENGTH('dbo.Reglas', 'empresa_id') IS NULL
    ALTER TABLE dbo.Reglas ADD empresa_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Servicios_Empresa')
    ALTER TABLE dbo.Servicios ADD CONSTRAINT FK_Servicios_Empresa
        FOREIGN KEY (empresa_id) REFERENCES dbo.Empresa(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Reglas_Empresa')
    ALTER TABLE dbo.Reglas ADD CONSTRAINT FK_Reglas_Empresa
        FOREIGN KEY (empresa_id) REFERENCES dbo.Empresa(id);
GO
UPDATE dbo.Servicios SET empresa_id = (SELECT TOP 1 id FROM dbo.Empresa WHERE nombre = 'ApuestaDB S.A.S.') WHERE empresa_id IS NULL;
UPDATE dbo.Reglas SET empresa_id = (SELECT TOP 1 id FROM dbo.Empresa WHERE nombre = 'ApuestaDB S.A.S.') WHERE empresa_id IS NULL;
GO

-- ===== P9: separacion Login/Auditoria =====
DELETE FROM dbo.Auditoria WHERE operacion = 'LOGIN';
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK__Auditoria__opera__28ED12D1' AND parent_object_id = OBJECT_ID('dbo.Auditoria'))
    ALTER TABLE dbo.Auditoria DROP CONSTRAINT CK__Auditoria__opera__28ED12D1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Auditoria_Operacion' AND parent_object_id = OBJECT_ID('dbo.Auditoria'))
    ALTER TABLE dbo.Auditoria ADD CONSTRAINT CK_Auditoria_Operacion
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'));
GO

-- ===== P10 (paso 1 de 2): UNIQUE(tipo_documento, numero_documento) =====
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_Usuario_TipoNumeroDoc' AND type = 'UQ')
    ALTER TABLE dbo.Usuario ADD CONSTRAINT UQ_Usuario_TipoNumeroDoc UNIQUE (tipo_documento, numero_documento);
GO

PRINT 'Migracion P1-P10 (parte B) aplicada.';
GO
