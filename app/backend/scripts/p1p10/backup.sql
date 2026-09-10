-- Backup previo a la migracion P1-P10 (autorizado por Jhon 09/sep/2026)
USE master;
GO
BACKUP DATABASE ApuestaDB
TO DISK = 'C:\Proyectos\ApuestaDB\app\backend\backups\ApuestaDB_bak_20260909_1917.bak'
WITH INIT, NAME = 'ApuestaDB backup pre-P1P10', CHECKSUM;
GO
