/* ============================================================================
   APUESTADB - 07_solo_colombia.sql
   Objetivo : dejar el catalogo limitado a futbol colombiano.
   Requiere : 01..06 y objetos (funciones, vistas, procedimientos, triggers).
   Idempotente: si no hay datos ajenos, los DELETE afectan 0 filas.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('tempdb..#equipos_ajenos') IS NOT NULL DROP TABLE #equipos_ajenos;
    IF OBJECT_ID('tempdb..#eventos_ajenos') IS NOT NULL DROP TABLE #eventos_ajenos;
    IF OBJECT_ID('tempdb..#opciones_ajenas') IS NOT NULL DROP TABLE #opciones_ajenas;
    IF OBJECT_ID('tempdb..#apuestas_ajenas') IS NOT NULL DROP TABLE #apuestas_ajenas;

    SELECT e.id_equipo INTO #equipos_ajenos
    FROM dbo.Equipo e
    JOIN dbo.Ciudad c ON c.id_ciudad = e.id_ciudad
    JOIN dbo.Pais p ON p.id_pais = c.id_pais
    WHERE p.nombre <> N'Colombia';

    SELECT v.id_evento INTO #eventos_ajenos
    FROM dbo.Evento v
    JOIN dbo.Temporada t ON t.id_temporada = v.id_temporada
    JOIN dbo.Liga l ON l.id_liga = t.id_liga
    WHERE l.nombre NOT LIKE N'Liga BetPlay%'
       OR v.id_equipo_local IN (SELECT id_equipo FROM #equipos_ajenos)
       OR v.id_equipo_visitante IN (SELECT id_equipo FROM #equipos_ajenos);

    SELECT o.id_opcion INTO #opciones_ajenas
    FROM dbo.OpcionApuesta o
    JOIN dbo.Mercado m ON m.id_mercado = o.id_mercado
    WHERE m.id_evento IN (SELECT id_evento FROM #eventos_ajenos);

    SELECT a.id_apuesta INTO #apuestas_ajenas
    FROM dbo.Apuesta a
    WHERE a.id_opcion IN (SELECT id_opcion FROM #opciones_ajenas);

    ALTER TABLE dbo.Liquidacion DISABLE TRIGGER ALL;
    ALTER TABLE dbo.Apuesta DISABLE TRIGGER ALL;
    ALTER TABLE dbo.MovimientoSaldo DISABLE TRIGGER ALL;
    ALTER TABLE dbo.HistorialCuota DISABLE TRIGGER ALL;
    ALTER TABLE dbo.OpcionApuesta DISABLE TRIGGER ALL;
    ALTER TABLE dbo.Mercado DISABLE TRIGGER ALL;
    ALTER TABLE dbo.Resultado DISABLE TRIGGER ALL;
    ALTER TABLE dbo.CalendarioArbitro DISABLE TRIGGER ALL;
    ALTER TABLE dbo.FavoritoEquipo DISABLE TRIGGER ALL;
    ALTER TABLE dbo.Evento DISABLE TRIGGER ALL;
    ALTER TABLE dbo.Equipo DISABLE TRIGGER ALL;

    DELETE FROM dbo.Liquidacion WHERE id_apuesta IN (SELECT id_apuesta FROM #apuestas_ajenas);
    DELETE FROM dbo.MovimientoSaldo WHERE id_apuesta IN (SELECT id_apuesta FROM #apuestas_ajenas);
    DELETE FROM dbo.Apuesta WHERE id_apuesta IN (SELECT id_apuesta FROM #apuestas_ajenas);
    DELETE FROM dbo.HistorialCuota WHERE id_opcion IN (SELECT id_opcion FROM #opciones_ajenas);
    DELETE FROM dbo.OpcionApuesta WHERE id_opcion IN (SELECT id_opcion FROM #opciones_ajenas);
    DELETE FROM dbo.Mercado WHERE id_evento IN (SELECT id_evento FROM #eventos_ajenos);
    DELETE FROM dbo.Resultado WHERE id_evento IN (SELECT id_evento FROM #eventos_ajenos);
    DELETE FROM dbo.CalendarioArbitro WHERE id_evento IN (SELECT id_evento FROM #eventos_ajenos);
    DELETE FROM dbo.FavoritoEquipo WHERE id_equipo IN (SELECT id_equipo FROM #equipos_ajenos);
    DELETE FROM dbo.Evento WHERE id_evento IN (SELECT id_evento FROM #eventos_ajenos);
    DELETE FROM dbo.Equipo WHERE id_equipo IN (SELECT id_equipo FROM #equipos_ajenos);

    ALTER TABLE dbo.Liquidacion ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Apuesta ENABLE TRIGGER ALL;
    ALTER TABLE dbo.MovimientoSaldo ENABLE TRIGGER ALL;
    ALTER TABLE dbo.HistorialCuota ENABLE TRIGGER ALL;
    ALTER TABLE dbo.OpcionApuesta ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Mercado ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Resultado ENABLE TRIGGER ALL;
    ALTER TABLE dbo.CalendarioArbitro ENABLE TRIGGER ALL;
    ALTER TABLE dbo.FavoritoEquipo ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Evento ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Equipo ENABLE TRIGGER ALL;

    DELETE FROM dbo.Temporada WHERE id_liga IN (SELECT id_liga FROM dbo.Liga WHERE nombre NOT LIKE N'Liga BetPlay%');
    DELETE FROM dbo.Liga WHERE nombre NOT LIKE N'Liga BetPlay%';
    DELETE FROM dbo.Deporte WHERE nombre <> N'Futbol';

    COMMIT;
    PRINT '07_solo_colombia.sql: catalogo limitado a futbol colombiano.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    ALTER TABLE dbo.Liquidacion ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Apuesta ENABLE TRIGGER ALL;
    ALTER TABLE dbo.MovimientoSaldo ENABLE TRIGGER ALL;
    ALTER TABLE dbo.HistorialCuota ENABLE TRIGGER ALL;
    ALTER TABLE dbo.OpcionApuesta ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Mercado ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Resultado ENABLE TRIGGER ALL;
    ALTER TABLE dbo.CalendarioArbitro ENABLE TRIGGER ALL;
    ALTER TABLE dbo.FavoritoEquipo ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Evento ENABLE TRIGGER ALL;
    ALTER TABLE dbo.Equipo ENABLE TRIGGER ALL;
    THROW;
END CATCH
GO
