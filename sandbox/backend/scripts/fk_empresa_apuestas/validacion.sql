/* ============================================================================
   ApuestaDB - Validacion post-migracion FK_Apuestas_Empresa
   ============================================================================ */
USE ApuestaDB;
GO

SET NOCOUNT ON;
GO

PRINT '1) FK creada, habilitada y de confianza';
SELECT fk.name AS fk,
       OBJECT_NAME(fk.parent_object_id) AS tabla_hija,
       (SELECT COL_NAME(fkc.parent_object_id, fkc.parent_column_id)
          FROM sys.foreign_key_columns fkc
         WHERE fkc.constraint_object_id = fk.object_id) AS columna_hija,
       OBJECT_NAME(fk.referenced_object_id) AS tabla_padre,
       fk.is_disabled, fk.is_not_trusted
FROM sys.foreign_keys fk
WHERE fk.name = 'FK_Apuestas_Empresa';
GO

PRINT '2) Filas sin mapear en Apuestas (debe ser 0)';
SELECT COUNT(*) AS sin_empresa FROM dbo.Apuestas WHERE empresa_id IS NULL;
GO

PRINT '3) Huerfanos (debe ser 0)';
SELECT COUNT(*) AS huerfanos
FROM dbo.Apuestas a
WHERE a.empresa_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.Empresa e WHERE e.id = a.empresa_id);
GO

PRINT '4) Tablas de dominio sin ninguna FK (debe ser 0; excluye sysdiagrams)';
SELECT COUNT(*) AS tablas_aisladas
FROM sys.tables t
WHERE t.is_ms_shipped = 0
  AND t.name <> 'sysdiagrams'
  AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys f WHERE f.parent_object_id = t.object_id)
  AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys f WHERE f.referenced_object_id = t.object_id);
GO

PRINT '5) Total de claves foraneas (esperado: 43)';
SELECT COUNT(*) AS total_fks FROM sys.foreign_keys;
GO

PRINT '6) Relaciones del grupo Empresa / Reglas / Servicios / Apuestas';
SELECT OBJECT_NAME(fk.parent_object_id) AS tabla_hija,
       OBJECT_NAME(fk.referenced_object_id) AS tabla_padre,
       fk.name AS fk
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN ('Empresa','Reglas','Servicios','Apuestas')
   OR OBJECT_NAME(fk.referenced_object_id) IN ('Empresa','Reglas','Servicios','Apuestas')
ORDER BY 1, 2;
GO
