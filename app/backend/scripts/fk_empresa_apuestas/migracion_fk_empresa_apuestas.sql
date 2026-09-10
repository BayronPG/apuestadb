/* ============================================================================
   ApuestaDB - Migracion: conectar Empresa con la oferta de apuestas
   ----------------------------------------------------------------------------
   Objetivo : que el trio Empresa / Reglas / Servicios deje de quedar como isla
              y quede integrado al resto del modelo.
   Cambio   : nueva columna Apuestas.empresa_id (INT NULL) + FK -> Empresa(id).
   Backfill : las ofertas existentes se asignan a la operadora principal
              (primera fila de Empresa por id); mismo criterio usado en P8.
   Idempotente: guards COL_LENGTH / sys.foreign_keys (segunda ejecucion = no-op).
   Rollback : rollback_fk_empresa_apuestas.sql (o restaurar el .bak previo).
   Ejecutar : sqlcmd -S .\SQLEXPRESS01 -E -b -f 65001 -i <este archivo>
   Nota     : cambio del sandbox; NO es requisito confirmado del profesor.
   ============================================================================ */
USE ApuestaDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT '== FK_Apuestas_Empresa: inicio ==';
GO

-- 1) Columna (nullable para no romper filas existentes)
IF COL_LENGTH('dbo.Apuestas','empresa_id') IS NULL
BEGIN
    ALTER TABLE dbo.Apuestas ADD empresa_id INT NULL;
    PRINT 'OK: columna dbo.Apuestas.empresa_id creada.';
END
ELSE
    PRINT 'SKIP: dbo.Apuestas.empresa_id ya existia.';
GO

-- 2) Backfill (solo filas sin asignar)
IF EXISTS (SELECT 1 FROM dbo.Apuestas WHERE empresa_id IS NULL)
BEGIN
    DECLARE @empresa_id INT;
    SELECT TOP (1) @empresa_id = id FROM dbo.Empresa ORDER BY id;

    IF @empresa_id IS NULL
        PRINT 'ERROR: no hay filas en Empresa; no se puede mapear.';
    ELSE
    BEGIN
        UPDATE dbo.Apuestas SET empresa_id = @empresa_id WHERE empresa_id IS NULL;
        PRINT 'OK: backfill Apuestas.empresa_id = ' + CAST(@empresa_id AS varchar)
              + ' en ' + CAST(@@ROWCOUNT AS varchar) + ' fila(s).';
    END
END
ELSE
    PRINT 'SKIP: no habia filas sin empresa_id.';
GO

-- 3) FK (habilitada y de confianza)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Apuestas_Empresa')
BEGIN
    ALTER TABLE dbo.Apuestas WITH CHECK
        ADD CONSTRAINT FK_Apuestas_Empresa
        FOREIGN KEY (empresa_id) REFERENCES dbo.Empresa(id);
    PRINT 'OK: FK_Apuestas_Empresa creada (trusted).';
END
ELSE
    PRINT 'SKIP: FK_Apuestas_Empresa ya existia.';
GO

PRINT '== FK_Apuestas_Empresa: fin ==';
GO
