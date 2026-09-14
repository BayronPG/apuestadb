/* P10 - paso final: retirar UNIQUE(numero_documento) simple, SOLO despues de
   validar que la regla compuesta UNIQUE(tipo_documento, numero_documento)
   funciona con backend, datos y pruebas (autorizado 09/sep/2026). */
USE ApuestaDB;
GO
SET NOCOUNT ON;
-- Retirar la unica simple de una sola columna sobre numero_documento (si existe)
DECLARE @n sysname;
DECLARE @sql nvarchar(300);
SELECT @n = i.name
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.Usuario')
  AND i.is_unique_constraint = 1
  AND EXISTS (SELECT 1 FROM sys.index_columns ic2
              JOIN sys.columns c ON c.object_id = ic2.object_id AND c.column_id = ic2.column_id
              WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id AND c.name = 'numero_documento')
  AND (SELECT COUNT(*) FROM sys.index_columns ic
       WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id) = 1;

IF @n IS NOT NULL
BEGIN
    SET @sql = 'ALTER TABLE dbo.Usuario DROP CONSTRAINT ' + QUOTENAME(@n);
    EXEC(@sql);
    PRINT 'Retirada restriccion simple: ' + @n;
END
ELSE
    PRINT 'No existe restriccion simple sobre numero_documento.';
GO
-- Verificacion: compuesta presente, simple ausente
SELECT i.name, i.type_desc
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.Usuario')
  AND (i.name = 'UQ_Usuario_TipoNumeroDoc' OR i.is_unique_constraint = 1)
ORDER BY i.name;
GO
