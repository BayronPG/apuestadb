/* ============================================================================
   MIGRACION P1-P10 - ApuestaDB (sandbox)
   ----------------------------------------------------------------------------
   Fecha  : 09/sep/2026
   Autor  : Jhon Bayron Pelaez Guerra (autorizacion explicita 09/sep/2026)
   Estado : APLICADA al sandbox SQLEXPRESS01. Sin commit ni push.
   Respaldo previo: app/backend/backups/ApuestaDB_bak_20260909_1917.bak
   Rollback: migracion_p1_p10_rollback.sql (reversible por pasos).
   Nota: migracion segun diagnostico real (constraints/mapeos verificados).
   ============================================================================ */

USE ApuestaDB;
GO

-- ============================================================================
-- P1: Calendario -> Estadio (sede del evento) + P4: Calendario -> Temporada
-- P2: Equipo -> Estadio (sede principal)
-- ============================================================================
IF COL_LENGTH('dbo.Calendario', 'estadio_id') IS NULL
    ALTER TABLE dbo.Calendario ADD estadio_id INT NULL;
GO
IF COL_LENGTH('dbo.Calendario', 'temporada_id') IS NULL
    ALTER TABLE dbo.Calendario ADD temporada_id INT NULL;
GO
IF COL_LENGTH('dbo.Equipo', 'estadio_id') IS NULL
    ALTER TABLE dbo.Equipo ADD estadio_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Calendario_Estadio')
    ALTER TABLE dbo.Calendario ADD CONSTRAINT FK_Calendario_Estadio
        FOREIGN KEY (estadio_id) REFERENCES dbo.Estadio(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Calendario_Temporada')
    ALTER TABLE dbo.Calendario ADD CONSTRAINT FK_Calendario_Temporada
        FOREIGN KEY (temporada_id) REFERENCES dbo.Temporada(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Equipo_Estadio')
    ALTER TABLE dbo.Equipo ADD CONSTRAINT FK_Equipo_Estadio
        FOREIGN KEY (estadio_id) REFERENCES dbo.Estadio(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Calendario_Estadio' AND object_id = OBJECT_ID('dbo.Calendario'))
    CREATE INDEX IX_Calendario_Estadio ON dbo.Calendario(estadio_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Calendario_Temporada' AND object_id = OBJECT_ID('dbo.Calendario'))
    CREATE INDEX IX_Calendario_Temporada ON dbo.Calendario(temporada_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Equipo_Estadio' AND object_id = OBJECT_ID('dbo.Equipo'))
    CREATE INDEX IX_Equipo_Estadio ON dbo.Equipo(estadio_id);
GO

-- P2 backfill: sede principal conocida de equipos (solo estadios reales del seed)
UPDATE e SET estadio_id = es.id
FROM dbo.Equipo e
JOIN dbo.Estadio es ON es.nombre = CASE e.nombre
    WHEN 'Atletico Nacional' THEN 'Atanasio Girardot'
    WHEN 'Deportivo Medellin' THEN 'Atanasio Girardot'
    WHEN 'Millonarios' THEN 'El Campin'
    WHEN 'Santa Fe' THEN 'El Campin'
    WHEN 'Junior' THEN 'Metropolitano'
END
WHERE e.estadio_id IS NULL AND es.nombre IS NOT NULL;
GO

-- P1 backfill: sede del evento = sede del equipo local (cuando es conocida)
UPDATE c SET estadio_id = e.estadio_id
FROM dbo.Calendario c
JOIN dbo.Equipo e ON e.id = c.equipo_local_id
WHERE c.estadio_id IS NULL AND e.estadio_id IS NOT NULL;
GO

-- ============================================================================
-- P3: Temporada -> Liga (se conserva deporte_id en transicion, redundancia
--     controlada y documentada: Temporada->Liga->Deportes)
-- ============================================================================
IF COL_LENGTH('dbo.Temporada', 'liga_id') IS NULL
    ALTER TABLE dbo.Temporada ADD liga_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Temporada_Liga')
    ALTER TABLE dbo.Temporada ADD CONSTRAINT FK_Temporada_Liga
        FOREIGN KEY (liga_id) REFERENCES dbo.Liga(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Temporada_Liga' AND object_id = OBJECT_ID('dbo.Temporada'))
    CREATE INDEX IX_Temporada_Liga ON dbo.Temporada(liga_id);
GO
-- Backfill: mapeo inequivoco deporte -> liga unica del seed
UPDATE t SET liga_id = l.id
FROM dbo.Temporada t
JOIN dbo.Liga l ON l.deporte_id = t.deporte_id
JOIN dbo.Deportes d ON d.id = t.deporte_id
WHERE t.liga_id IS NULL
  AND l.nombre IN ('Liga BetPlay', 'NBA', 'ATP Tour')
  AND t.nombre IN ('Clausura 2026', 'Apertura 2026', 'NBA 2026-27', 'Gira ATP 2026');
GO
-- Nota: 'Copa del Rey 2026' queda sin liga (NULL): su asignacion (Liga ACB vs
-- otra) es una decision de mapeo pendiente, no se asume.

-- ============================================================================
-- P4 backfill: evento -> temporada de su liga que cubre su fecha
-- ============================================================================
UPDATE c SET temporada_id = t.id
FROM dbo.Calendario c
JOIN dbo.Temporada t ON t.liga_id = c.liga_id
WHERE c.temporada_id IS NULL
  AND c.fecha_hora >= t.fecha_inicio
  AND c.fecha_hora <= t.fecha_fin;
GO
-- Nota: eventos NBA sembrados en sep/2026 quedan fuera de la ventana de la
-- temporada NBA 2026-27 (inicia oct/2026) -> permanecen NULL, documentado.

-- ============================================================================
-- P5: Liga -> Pais (reemplazo conceptual del texto Liga.pais; la columna
--     texto se conserva durante la transicion)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Pais WHERE nombre = 'Internacional')
    INSERT INTO dbo.Pais (nombre, codigo_iso) VALUES ('Internacional', NULL);
GO
IF COL_LENGTH('dbo.Liga', 'pais_id') IS NULL
    ALTER TABLE dbo.Liga ADD pais_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Liga_Pais')
    ALTER TABLE dbo.Liga ADD CONSTRAINT FK_Liga_Pais
        FOREIGN KEY (pais_id) REFERENCES dbo.Pais(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Liga_Pais' AND object_id = OBJECT_ID('dbo.Liga'))
    CREATE INDEX IX_Liga_Pais ON dbo.Liga(pais_id);
GO
UPDATE l SET pais_id = p.id
FROM dbo.Liga l
JOIN dbo.Pais p ON p.nombre = l.pais
WHERE l.pais_id IS NULL AND l.pais IS NOT NULL;
GO

-- ============================================================================
-- P6: LogPago -> Recarga (1 recarga aprobada -> a lo sumo 1 movimiento)
-- ============================================================================
IF COL_LENGTH('dbo.LogPago', 'recarga_id') IS NULL
    ALTER TABLE dbo.LogPago ADD recarga_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_LogPago_Recarga')
    ALTER TABLE dbo.LogPago ADD CONSTRAINT FK_LogPago_Recarga
        FOREIGN KEY (recarga_id) REFERENCES dbo.Recarga(id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_LogPago_Recarga' AND type = 'UQ')
    ALTER TABLE dbo.LogPago ADD CONSTRAINT UQ_LogPago_Recarga UNIQUE (recarga_id);
GO
-- Backfill: movimientos 'recarga' que corresponden a solicitudes aprobadas
-- (usuario + tipo de saldo + monto); los no emparejados quedan NULL.
UPDATE lp SET recarga_id = r.id
FROM dbo.LogPago lp
JOIN dbo.Recarga r
  ON r.usuario_id = lp.usuario_id
 AND r.tipo_saldo_id = lp.tipo_saldo_id
 AND r.monto = lp.monto
 AND r.estado = 'aprobada'
WHERE lp.tipo = 'recarga' AND lp.recarga_id IS NULL;
GO

-- ============================================================================
-- P7: Notificacion -> HacerApuesta / Recarga (origen real; sin polimorfismo)
-- ============================================================================
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
-- Restriccion anti-contradiccion: la notificacion tiene a lo sumo UN origen.
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Notificacion_OrigenUnico' AND parent_object_id = OBJECT_ID('dbo.Notificacion'))
    ALTER TABLE dbo.Notificacion ADD CONSTRAINT CK_Notificacion_OrigenUnico
        CHECK (hacer_apuesta_id IS NULL OR recarga_id IS NULL);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_HacerApuesta' AND object_id = OBJECT_ID('dbo.Notificacion'))
    CREATE INDEX IX_Notificacion_HacerApuesta ON dbo.Notificacion(hacer_apuesta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_Recarga' AND object_id = OBJECT_ID('dbo.Notificacion'))
    CREATE INDEX IX_Notificacion_Recarga ON dbo.Notificacion(recarga_id);
GO
-- Backfill de seeds: notificaciones de resultado/apuesta -> HacerApuesta real;
-- promocionales y de sistema quedan sin entidad (NULL), como corresponde.
UPDATE n SET hacer_apuesta_id = ha.id
FROM dbo.Notificacion n
JOIN dbo.HacerApuesta ha
  ON ha.usuario_id = n.usuario_id AND ha.fecha < n.fecha
WHERE n.hacer_apuesta_id IS NULL
  AND n.tipo IN ('resultado', 'apuesta')
  AND ha.id = (SELECT TOP 1 h2.id FROM dbo.HacerApuesta h2
               WHERE h2.usuario_id = n.usuario_id AND h2.fecha < n.fecha
               ORDER BY h2.fecha DESC);
GO

-- ============================================================================
-- P8: integracion justificada de Empresa/Servicios/Reglas
--     Justificacion: la operadora principal (Empresa 'ApuestaDB S.A.S.')
--     ofrece los servicios y emite las reglas de la plataforma; las demas
--     empresas del seed quedan disponibles para futuras asignaciones.
--     NULL = servicio/regla global de la plataforma (permitido).
-- ============================================================================
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

-- ============================================================================
-- P9: separacion funcional Login/Auditoria
--     Login = fuente especializada de intentos de acceso (backend ya solo escribe
--     ahi). Auditoria = resto de operaciones. Se retira el uso de LOGIN:
--     1) se elimina el registro historico de siembra duplicado (respaldado en
--        el .bak y restaurable con el rollback), 2) se recrea el CHECK sin LOGIN.
-- ============================================================================
DELETE FROM dbo.Auditoria WHERE operacion = 'LOGIN';
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK__Auditoria__opera__28ED12D1' AND parent_object_id = OBJECT_ID('dbo.Auditoria'))
    ALTER TABLE dbo.Auditoria DROP CONSTRAINT CK__Auditoria__opera__28ED12D1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Auditoria_Operacion' AND parent_object_id = OBJECT_ID('dbo.Auditoria'))
    ALTER TABLE dbo.Auditoria ADD CONSTRAINT CK_Auditoria_Operacion
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'));
GO

-- ============================================================================
-- P10 (paso 1 de 2): UNIQUE(tipo_documento, numero_documento).
--     Se conserva UNIQUE(numero_documento) en transicion; el retiro de la
--     restriccion simple se ejecuta SOLO tras validar backend y pruebas
--     (ver paso_final_p10.sql). Sin duplicados detectados en el diagnostico.
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_Usuario_TipoNumeroDoc' AND type = 'UQ')
    ALTER TABLE dbo.Usuario ADD CONSTRAINT UQ_Usuario_TipoNumeroDoc UNIQUE (tipo_documento, numero_documento);
GO

PRINT 'Migracion P1-P10 aplicada.';
GO
