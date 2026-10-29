/* ============================================================================
   APUESTADB - 01_database.sql
   Asignatura : Bases de Datos 2 (Tecnologico de Antioquia)
   Integrantes: Jhon Bayron Pelaez Guerra - Shantal Coneo Garcia
   Motor      : Microsoft SQL Server (ejecutable en SSMS)
   Objetivo   : Crear la base de datos y el contexto de trabajo.
   Orden de ejecucion: 01 -> 02 -> 03 -> 04 -> 05
   ----------------------------------------------------------------------------
   Notas:
   - Se usa el esquema estandar [dbo]; no se requiere un esquema adicional.
   - El modelo de recuperacion se deja en SIMPLE (proyecto academico).
   ============================================================================ */

SET NOCOUNT ON;
GO

/* --------------------------------------------------------------------------
   1. Crear la base de datos si no existe
   -------------------------------------------------------------------------- */
IF DB_ID(N'ApuestaDB') IS NULL
BEGIN
    CREATE DATABASE ApuestaDB;
    PRINT 'Base de datos ApuestaDB creada.';
END
ELSE
BEGIN
    PRINT 'La base de datos ApuestaDB ya existe.';
END
GO

/* --------------------------------------------------------------------------
   2. Opciones de la base de datos
   -------------------------------------------------------------------------- */
ALTER DATABASE ApuestaDB SET RECOVERY SIMPLE;
GO
ALTER DATABASE ApuestaDB SET AUTO_CLOSE OFF;
GO
ALTER DATABASE ApuestaDB SET READ_COMMITTED_SNAPSHOT OFF;
GO

/* --------------------------------------------------------------------------
   3. Contexto
   -------------------------------------------------------------------------- */
USE ApuestaDB;
GO

PRINT 'ApuestaDB lista para crear objetos.';
GO
