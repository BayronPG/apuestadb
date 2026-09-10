/* ============================================================================
   ApuestaDB - Rollback de la migracion FK_Apuestas_Empresa
   ----------------------------------------------------------------------------
   Deshace en orden inverso: primero la FK, luego la columna.
   Al eliminar la columna se pierden los valores del backfill; quedan en el
   backup .bak previo a la migracion (app/backend/backups/).
   Ejecutar : sqlcmd -S .\SQLEXPRESS01 -E -b -f 65001 -i <este archivo>
   ============================================================================ */
USE ApuestaDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Apuestas_Empresa')
BEGIN
    ALTER TABLE dbo.Apuestas DROP CONSTRAINT FK_Apuestas_Empresa;
    PRINT 'OK: FK_Apuestas_Empresa eliminada.';
END
ELSE
    PRINT 'SKIP: FK_Apuestas_Empresa no existia.';
GO

IF COL_LENGTH('dbo.Apuestas','empresa_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Apuestas DROP COLUMN empresa_id;
    PRINT 'OK: columna dbo.Apuestas.empresa_id eliminada.';
END
ELSE
    PRINT 'SKIP: la columna no existia.';
GO
