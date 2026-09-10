USE ApuestaDB;
GO
SET NOCOUNT ON;
PRINT '== 1. Tablas completamente aisladas (esperado: 0) ==';
SELECT t.name AS tabla_aislada
FROM sys.tables t
WHERE NOT EXISTS (SELECT 1 FROM sys.foreign_keys fk WHERE fk.parent_object_id = t.object_id)
  AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys fk2 WHERE fk2.referenced_object_id = t.object_id)
ORDER BY 1;
PRINT '== 2. FKs nuevas presentes (esperado 10) ==';
SELECT COUNT(*) AS fks_nuevas FROM sys.foreign_keys
WHERE name IN ('FK_Calendario_Estadio','FK_Calendario_Temporada','FK_Equipo_Estadio',
               'FK_Temporada_Liga','FK_Liga_Pais','FK_LogPago_Recarga',
               'FK_Notificacion_HacerApuesta','FK_Notificacion_Recarga',
               'FK_Servicios_Empresa','FK_Reglas_Empresa');
PRINT '== 3. Constraints nuevos ==';
SELECT name, type_desc FROM sys.objects
WHERE name IN ('CK_Notificacion_OrigenUnico','CK_Auditoria_Operacion','UQ_Usuario_TipoNumeroDoc')
ORDER BY name;
PRINT '== 4. Indice unico filtrado LogPago ==';
SELECT name, filter_definition FROM sys.indexes WHERE name = 'UQ_LogPago_Recarga';
PRINT '== 5. Auditoria LOGIN (esperado 0) ==';
SELECT COUNT(*) AS auditoria_login FROM dbo.Auditoria WHERE operacion = 'LOGIN';
PRINT '== 6. Notificacion origen ==';
SELECT tipo, COUNT(*) AS total, SUM(CASE WHEN hacer_apuesta_id IS NOT NULL THEN 1 ELSE 0 END) AS con_hacer_apuesta, SUM(CASE WHEN recarga_id IS NOT NULL THEN 1 ELSE 0 END) AS con_recarga, SUM(CASE WHEN hacer_apuesta_id IS NULL AND recarga_id IS NULL THEN 1 ELSE 0 END) AS sin_entidad FROM dbo.Notificacion GROUP BY tipo ORDER BY tipo;
PRINT '== 7. Liga pais_id ==';
SELECT id, nombre, pais, pais_id FROM dbo.Liga ORDER BY id;
PRINT '== 8. Temporada liga_id ==';
SELECT id, nombre, deporte_id, liga_id FROM dbo.Temporada ORDER BY id;
PRINT '== 9. Calendario estadio/temporada ==';
SELECT id, liga_id, estado, estadio_id, temporada_id FROM dbo.Calendario ORDER BY id;
PRINT '== 10. Equipo estadio_id ==';
SELECT id, nombre, estadio_id FROM dbo.Equipo ORDER BY id;
PRINT '== 11. LogPago recarga_id ==';
SELECT id, usuario_id, tipo, monto, recarga_id FROM dbo.LogPago WHERE tipo = 'recarga' ORDER BY id;
PRINT '== 12. Servicios/Reglas empresa_id (nulos = globales) ==';
SELECT 'Servicios' AS tabla, COUNT(*) AS total, SUM(CASE WHEN empresa_id IS NULL THEN 1 ELSE 0 END) AS nulos FROM dbo.Servicios
UNION ALL
SELECT 'Reglas', COUNT(*), SUM(CASE WHEN empresa_id IS NULL THEN 1 ELSE 0 END) FROM dbo.Reglas;
PRINT '== 13. Total tablas conectadas (esperado 29, ninguna aislada arriba) ==';
SELECT COUNT(*) AS total_tablas FROM sys.tables;
GO
