/* ============================================================================
   APUESTADB - MODELO ACTUAL: 29 tablas con >= 5 registros cada una
   ----------------------------------------------------------------------------
   Motor   : SQL Server (T-SQL)
   Fecha   : 02/sep/2026
   Estado  : AMPLIACION INCORPORADA AL MODELO ACTUAL DEL PROYECTO (sandbox).
             El modelo inicial trabajado en clase tiene 16 tablas
             (script_tablas_sqlserver_borrador.sql + script_datos_prueba_borrador.sql);
             esta ampliacion incorpora 13 tablas adicionales (16 + 13 = 29).
             Las 29 tablas forman parte del modelo actual de la base de datos
             del proyecto y cada una conserva al menos 5 registros de
             demostracion (datos ficticios).
   Los scripts originales de clase NO se modifican y permanecen intactos;
   la ampliacion se mantiene en este script independiente.
   Idempotencia: puede ejecutarse mas de una vez; solo crea tablas que no
                 existan y solo inserta cuando el conteo de la tabla es menor
                 a 5 (no duplica datos).
   Ejecutar  : sqlcmd -S .\SQLEXPRESS01 -E -f 65001 -i src\backend\scripts\script_ampliacion_sandbox_29_tablas.sql
   ============================================================================ */

USE ApuestaDB;
GO

-- ============================================================================
-- A) 13 TABLAS ADICIONALES INCORPORADAS AL MODELO (16 de clase + 13 = 29)
--    Justificacion: geografia, historicos, auditoria, seguridad y
--    funcionalidades del sandbox academico.
-- ============================================================================

-- 17. PAIS (geografia; normalizacion futura de textos como Liga.pais)
IF OBJECT_ID('dbo.Pais', 'U') IS NULL
BEGIN
    CREATE TABLE Pais (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        nombre     VARCHAR(60)   NOT NULL UNIQUE,
        codigo_iso CHAR(2)       NULL,
        estado     VARCHAR(20)   NOT NULL DEFAULT 'activo'
            CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

-- 18. CIUDAD (geografia)
IF OBJECT_ID('dbo.Ciudad', 'U') IS NULL
BEGIN
    CREATE TABLE Ciudad (
        id       INT IDENTITY(1,1) PRIMARY KEY,
        nombre   VARCHAR(80)   NOT NULL,
        pais_id  INT           NOT NULL
            CONSTRAINT FK_Ciudad_Pais REFERENCES Pais(id),
        estado   VARCHAR(20)   NOT NULL DEFAULT 'activo'
            CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

-- 19. ESTADIO (sede de equipos y eventos)
IF OBJECT_ID('dbo.Estadio', 'U') IS NULL
BEGIN
    CREATE TABLE Estadio (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        nombre      VARCHAR(100)  NOT NULL,
        ciudad_id   INT           NOT NULL
            CONSTRAINT FK_Estadio_Ciudad REFERENCES Ciudad(id),
        capacidad   INT           NULL CHECK (capacidad IS NULL OR capacidad > 0),
        estado      VARCHAR(20)   NOT NULL DEFAULT 'activo'
            CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

-- 20. TEMPORADA (periodos oficiales por deporte)
IF OBJECT_ID('dbo.Temporada', 'U') IS NULL
BEGIN
    CREATE TABLE Temporada (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        nombre        VARCHAR(80)   NOT NULL,
        deporte_id    INT           NOT NULL
            CONSTRAINT FK_Temporada_Deportes REFERENCES Deportes(id),
        fecha_inicio  DATE          NOT NULL,
        fecha_fin     DATE          NOT NULL,
        estado        VARCHAR(20)   NOT NULL DEFAULT 'activa'
            CHECK (estado IN ('activa', 'cerrada')),
        CONSTRAINT CK_Temporada_Fechas CHECK (fecha_fin >= fecha_inicio)
    );
END
GO

-- 21. ARBITRO (oficiales de los eventos)
IF OBJECT_ID('dbo.Arbitro', 'U') IS NULL
BEGIN
    CREATE TABLE Arbitro (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        primer_nombre NVARCHAR(60)  NOT NULL,
        segundo_nombre NVARCHAR(60) NULL,
        primer_apellido NVARCHAR(60) NOT NULL,
        segundo_apellido NVARCHAR(60) NULL,
        numero_documento VARCHAR(20) NOT NULL UNIQUE,
        estado        VARCHAR(20)   NOT NULL DEFAULT 'activo'
            CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

-- 22. CALENDARIO_ARBITRO (relacion N:M evento <-> arbitro)
IF OBJECT_ID('dbo.CalendarioArbitro', 'U') IS NULL
BEGIN
    CREATE TABLE CalendarioArbitro (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        calendario_id INT NOT NULL
            CONSTRAINT FK_CalendarioArbitro_Calendario REFERENCES Calendario(id),
        arbitro_id    INT NOT NULL
            CONSTRAINT FK_CalendarioArbitro_Arbitro REFERENCES Arbitro(id),
        rol           VARCHAR(20) NOT NULL DEFAULT 'central'
            CHECK (rol IN ('central', 'linea1', 'linea2', 'cuarto')),
        CONSTRAINT UQ_CalendarioArbitro UNIQUE (calendario_id, arbitro_id)
    );
END
GO

-- 23. HISTORIAL_CUOTA (trazabilidad de cambios de cuota; apoya reglas #4 y #5)
IF OBJECT_ID('dbo.HistorialCuota', 'U') IS NULL
BEGIN
    CREATE TABLE HistorialCuota (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        apuesta_id     INT           NOT NULL
            CONSTRAINT FK_HistorialCuota_Apuestas REFERENCES Apuestas(id),
        usuario_id     INT           NULL
            CONSTRAINT FK_HistorialCuota_Usuario REFERENCES Usuario(id),
        cuota_anterior DECIMAL(6,2)  NULL CHECK (cuota_anterior IS NULL OR cuota_anterior > 1),
        cuota_nueva    DECIMAL(6,2)  NOT NULL CHECK (cuota_nueva > 1),
        fecha_cambio   DATETIME2     NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- 24. RECARGA (solicitudes de recarga de saldo ficticio, tokens o PSE)
IF OBJECT_ID('dbo.Recarga', 'U') IS NULL
BEGIN
    CREATE TABLE Recarga (
        id                INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id        INT           NOT NULL
            CONSTRAINT FK_Recarga_Usuario REFERENCES Usuario(id),
        tipo_saldo_id     INT           NOT NULL
            CONSTRAINT FK_Recarga_TipoSaldo REFERENCES TipoSaldo(id),
        monto             DECIMAL(12,2) NOT NULL CHECK (monto > 0),
        estado            VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
            CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
        fecha_solicitud   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        fecha_aprobacion  DATETIME2     NULL
    );
END
GO

-- 25. NOTIFICACION (avisos al usuario: resultados, apuestas, sistema)
IF OBJECT_ID('dbo.Notificacion', 'U') IS NULL
BEGIN
    CREATE TABLE Notificacion (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id INT            NOT NULL
            CONSTRAINT FK_Notificacion_Usuario REFERENCES Usuario(id),
        tipo       VARCHAR(20)    NOT NULL DEFAULT 'sistema'
            CHECK (tipo IN ('resultado', 'apuesta', 'promocion', 'sistema')),
        mensaje    NVARCHAR(300)  NOT NULL,
        leida      BIT            NOT NULL DEFAULT 0,
        fecha      DATETIME2      NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- 26. FAVORITO_EQUIPO (relacion N:M usuario <-> equipo)
IF OBJECT_ID('dbo.FavoritoEquipo', 'U') IS NULL
BEGIN
    CREATE TABLE FavoritoEquipo (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id    INT NOT NULL
            CONSTRAINT FK_FavoritoEquipo_Usuario REFERENCES Usuario(id),
        equipo_id     INT NOT NULL
            CONSTRAINT FK_FavoritoEquipo_Equipo REFERENCES Equipo(id),
        fecha_registro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_FavoritoEquipo UNIQUE (usuario_id, equipo_id)
    );
END
GO

-- 27. PREGUNTA_SEGURIDAD (catalogo para recuperacion futura de contrasena)
IF OBJECT_ID('dbo.PreguntaSeguridad', 'U') IS NULL
BEGIN
    CREATE TABLE PreguntaSeguridad (
        id       INT IDENTITY(1,1) PRIMARY KEY,
        pregunta NVARCHAR(200) NOT NULL UNIQUE,
        estado   VARCHAR(20)   NOT NULL DEFAULT 'activo'
            CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

-- 28. RESPUESTA_SEGURIDAD (respuestas del usuario; texto ficticio de prueba)
IF OBJECT_ID('dbo.RespuestaSeguridad', 'U') IS NULL
BEGIN
    CREATE TABLE RespuestaSeguridad (
        id           INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id   INT           NOT NULL
            CONSTRAINT FK_RespuestaSeguridad_Usuario REFERENCES Usuario(id),
        pregunta_id  INT           NOT NULL
            CONSTRAINT FK_RespuestaSeguridad_Pregunta REFERENCES PreguntaSeguridad(id),
        respuesta    NVARCHAR(200) NOT NULL,
        fecha_registro DATETIME2   NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_RespuestaSeguridad UNIQUE (usuario_id, pregunta_id)
    );
END
GO

-- 29. AUDITORIA (bitacora general de operaciones importantes)
IF OBJECT_ID('dbo.Auditoria', 'U') IS NULL
BEGIN
    CREATE TABLE Auditoria (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id     INT            NULL
            CONSTRAINT FK_Auditoria_Usuario REFERENCES Usuario(id),
        tabla_afectada VARCHAR(60)    NOT NULL,
        operacion      VARCHAR(20)    NOT NULL
            CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN')),
        detalle        NVARCHAR(500)  NULL,
        fecha          DATETIME2      NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- ============================================================================
-- B) DATOS: garantizar >= 5 registros en las 29 tablas
--    Mecanismo: bloques IF COUNT(*)<5 para rellenar tablas con pocas filas, e
--    inserts idempotentes por clave (NOT EXISTS) para los datos de demostracion
--    que deben existir siempre. La doble ejecucion no duplica datos.
-- ============================================================================

-- Usuario: el seed de clase deja 2; se agregan 3 de demostracion (hash ficticio,
-- igual que el seed de clase; no pueden iniciar sesion hasta tener hash real).
-- Inserts idempotentes por numero de documento (se ejecutan siempre).
INSERT INTO Usuario (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                     rol_id, tipo_documento, numero_documento, celular, correo,
                     contrasena_hash, estado)
SELECT 'Laura', NULL, 'Gomez', 'Rios',
       (SELECT id FROM Rol WHERE nombre = 'usuario'), 'CC', '1033000001', '3011112222',
       'laura.gomez@apuestadb.com', 'HASH_FICTICIO_$2b$12$demoSandboxNoReal', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM Usuario WHERE numero_documento = '1033000001');

INSERT INTO Usuario (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                     rol_id, tipo_documento, numero_documento, celular, correo,
                     contrasena_hash, estado)
SELECT 'Andres', 'Felipe', 'Torres', 'Mesa',
       (SELECT id FROM Rol WHERE nombre = 'usuario'), 'CC', '1033000002', '3013334444',
       'andres.torres@apuestadb.com', 'HASH_FICTICIO_$2b$12$demoSandboxNoReal', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM Usuario WHERE numero_documento = '1033000002');

INSERT INTO Usuario (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                     rol_id, tipo_documento, numero_documento, celular, correo,
                     contrasena_hash, estado)
SELECT 'Valentina', NULL, 'Castro', 'Lopez',
       (SELECT id FROM Rol WHERE nombre = 'usuario'), 'CE', '1033000003', '3025556666',
       'valentina.castro@apuestadb.com', 'HASH_FICTICIO_$2b$12$demoSandboxNoReal', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM Usuario WHERE numero_documento = '1033000003');
GO

-- Rol (roles adicionales del modelo actual)
IF (SELECT COUNT(*) FROM dbo.Rol) < 5
BEGIN
    INSERT INTO Rol (nombre, descripcion) VALUES
        ('moderador', 'Modera contenido y resuelve reclamos'),
        ('soporte',   'Atiende solicitudes de soporte'),
        ('analista',  'Consulta reportes y estadisticas');
END
GO

-- Empresa
IF (SELECT COUNT(*) FROM dbo.Empresa) < 5
BEGIN
    INSERT INTO Empresa (nombre, nit, telefono, correo, estado) VALUES
        ('ApuestaDB Operadora SAS', '900000002', '6041112233', 'operadora@apuestadb.com', 'activo'),
        ('Deportes Simulados SA',   '900000003', '6044445566', 'deportes@apuestadb.com',  'activo'),
        ('Betplay Academico SAS',   '900000004', '6047778899', 'betplay@apuestadb.com',   'activo'),
        ('Torneos Ficticios Ltda',  '900000005', '6012223344', 'torneos@apuestadb.com',   'activo');
END
GO

-- Servicios (servicios adicionales del modelo actual)
IF (SELECT COUNT(*) FROM dbo.Servicios) < 5
BEGIN
    INSERT INTO Servicios (nombre, descripcion, estado) VALUES
        ('consulta_saldo',      'Consulta de saldo por tipo (tokens/PSE)', 'activo'),
        ('historial_apuestas',  'Historial de apuestas del cliente',       'activo'),
        ('soporte_tecnico',     'Mesa de ayuda academica',                 'activo');
END
GO

-- Reglas (reglas configurables del modelo actual)
IF (SELECT COUNT(*) FROM dbo.Reglas) < 5
BEGIN
    INSERT INTO Reglas (nombre, descripcion, parametro, estado) VALUES
        ('monto_minimo_apuesta',     'Monto minimo por apuesta',      '1000',     'activo'),
        ('monto_maximo_apuesta',     'Monto maximo por apuesta',      '2000000',  'activo'),
        ('limite_recarga_diaria',    'Tope de recarga ficticia diaria','500000',  'activo'),
        ('tiempo_entre_apuestas',    'Segundos minimos entre apuestas','30',      'activo');
END
GO

-- Deportes: el modelo de clase incluia futbol; el modelo actual incorpora
-- deportes adicionales (baloncesto, tenis, ciclismo, voleibol)
IF (SELECT COUNT(*) FROM dbo.Deportes) < 5
BEGIN
    INSERT INTO Deportes (nombre, estado) VALUES
        ('baloncesto', 'activo'),
        ('tenis',      'activo'),
        ('ciclismo',   'activo'),
        ('voleibol',   'activo');
END
GO

-- TipoSaldo: tipos adicionales incorporados al modelo; los principales
-- siguen siendo tokens y PSE (regla R1 del profesor)
IF (SELECT COUNT(*) FROM dbo.TipoSaldo) < 5
BEGIN
    INSERT INTO TipoSaldo (nombre, descripcion, estado) VALUES
        ('bonos',          'Bonos ficticios de bienvenida', 'activo'),
        ('cashback',       'Devolucion ficticia por promociones', 'activo'),
        ('apuesta_gratis', 'Apuestas gratis ficticias', 'activo');
END
GO

-- Pais
IF (SELECT COUNT(*) FROM dbo.Pais) < 5
BEGIN
    INSERT INTO Pais (nombre, codigo_iso) VALUES
        ('Colombia', 'CO'), ('Espana', 'ES'), ('Estados Unidos', 'US'),
        ('Argentina', 'AR'), ('Francia', 'FR');
END
GO

-- Ciudad
IF (SELECT COUNT(*) FROM dbo.Ciudad) < 5
BEGIN
    INSERT INTO Ciudad (nombre, pais_id) VALUES
        ('Medellin',     (SELECT id FROM Pais WHERE nombre = 'Colombia')),
        ('Bogota',       (SELECT id FROM Pais WHERE nombre = 'Colombia')),
        ('Barranquilla', (SELECT id FROM Pais WHERE nombre = 'Colombia')),
        ('Madrid',       (SELECT id FROM Pais WHERE nombre = 'Espana')),
        ('Buenos Aires', (SELECT id FROM Pais WHERE nombre = 'Argentina'));
END
GO

-- Estadio
IF (SELECT COUNT(*) FROM dbo.Estadio) < 5
BEGIN
    INSERT INTO Estadio (nombre, ciudad_id, capacidad) VALUES
        ('Atanasio Girardot',     (SELECT id FROM Ciudad WHERE nombre = 'Medellin'), 45000),
        ('El Campin',             (SELECT id FROM Ciudad WHERE nombre = 'Bogota'),     36000),
        ('Metropolitano',         (SELECT id FROM Ciudad WHERE nombre = 'Barranquilla'), 46000),
        ('Santiago Bernabeu',     (SELECT id FROM Ciudad WHERE nombre = 'Madrid'),      81000),
        ('Monumental de Nunez',   (SELECT id FROM Ciudad WHERE nombre = 'Buenos Aires'), 84000);
END
GO

-- Liga: el seed de clase deja 1 (Liga BetPlay); se agregan 4 ligas del
-- modelo actual
IF (SELECT COUNT(*) FROM dbo.Liga) < 5
BEGIN
    INSERT INTO Liga (nombre, deporte_id, pais) VALUES
        ('Liga BetPlay Femenina', (SELECT id FROM Deportes WHERE nombre = 'futbol'),     'Colombia'),
        ('NBA',                   (SELECT id FROM Deportes WHERE nombre = 'baloncesto'), 'Estados Unidos'),
        ('Liga ACB',              (SELECT id FROM Deportes WHERE nombre = 'baloncesto'), 'Espana'),
        ('ATP Tour',              (SELECT id FROM Deportes WHERE nombre = 'tenis'),      'Internacional');
END
GO

-- Equipo: el seed de clase deja 4; se agregan 6 para cubrir las ligas nuevas
IF (SELECT COUNT(*) FROM dbo.Equipo) < 5
BEGIN
    INSERT INTO Equipo (nombre, liga_id, estado) VALUES
        ('Junior',        (SELECT id FROM Liga WHERE nombre = 'Liga BetPlay'), 'activo'),
        ('Santa Fe',      (SELECT id FROM Liga WHERE nombre = 'Liga BetPlay'), 'activo'),
        ('Deportivo Cali',(SELECT id FROM Liga WHERE nombre = 'Liga BetPlay'), 'activo'),
        ('Golden State Warriors', (SELECT id FROM Liga WHERE nombre = 'NBA'),  'activo'),
        ('Boston Celtics',        (SELECT id FROM Liga WHERE nombre = 'NBA'),  'activo'),
        ('La Equidad',    (SELECT id FROM Liga WHERE nombre = 'Liga BetPlay'), 'activo');
END
GO

-- Temporada
IF (SELECT COUNT(*) FROM dbo.Temporada) < 5
BEGIN
    INSERT INTO Temporada (nombre, deporte_id, fecha_inicio, fecha_fin, estado) VALUES
        ('Clausura 2026',      (SELECT id FROM Deportes WHERE nombre = 'futbol'),     '2026-07-01', '2026-12-15', 'activa'),
        ('Apertura 2026',      (SELECT id FROM Deportes WHERE nombre = 'futbol'),     '2026-01-20', '2026-06-10', 'cerrada'),
        ('NBA 2026-27',        (SELECT id FROM Deportes WHERE nombre = 'baloncesto'), '2026-10-20', '2027-06-20', 'activa'),
        ('Copa del Rey 2026',  (SELECT id FROM Deportes WHERE nombre = 'baloncesto'), '2026-09-01', '2027-02-15', 'activa'),
        ('Gira ATP 2026',      (SELECT id FROM Deportes WHERE nombre = 'tenis'),      '2026-01-01', '2026-11-30', 'cerrada');
END
GO

-- Arbitro
IF (SELECT COUNT(*) FROM dbo.Arbitro) < 5
BEGIN
    INSERT INTO Arbitro (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, numero_documento) VALUES
        ('Carlos', 'Andres', 'Betancur', 'Ospina', '71000001'),
        ('Maria',  NULL,     'Restrepo', 'Jaramillo', '71000002'),
        ('Luis',   'Eduardo', 'Salazar', NULL, '71000003'),
        ('Diana',  NULL,     'Martinez', 'Cifuentes', '71000004'),
        ('Jorge',  NULL,     'Velez',    'Quintero', '71000005');
END
GO

-- Calendario: el seed de clase deja 2; se agregan 6 (variedad de estados)
IF (SELECT COUNT(*) FROM dbo.Calendario) < 5
BEGIN
    INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
    SELECT l.id, el.id, ev.id, '2026-09-15 18:00:00', 'programado'
    FROM Liga l, Equipo el, Equipo ev
    WHERE l.nombre = 'Liga BetPlay'
      AND el.nombre = 'Junior' AND ev.nombre = 'Santa Fe';

    INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
    SELECT l.id, el.id, ev.id, '2026-09-10 20:15:00', 'en_curso'
    FROM Liga l, Equipo el, Equipo ev
    WHERE l.nombre = 'Liga BetPlay'
      AND el.nombre = 'Deportivo Cali' AND ev.nombre = 'Atletico Nacional';

    INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
    SELECT l.id, el.id, ev.id, '2026-09-05 21:00:00', 'finalizado'
    FROM Liga l, Equipo el, Equipo ev
    WHERE l.nombre = 'NBA'
      AND el.nombre = 'Golden State Warriors' AND ev.nombre = 'Boston Celtics';

    INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
    SELECT l.id, el.id, ev.id, '2026-09-06 18:30:00', 'finalizado'
    FROM Liga l, Equipo el, Equipo ev
    WHERE l.nombre = 'Liga BetPlay'
      AND el.nombre = 'Junior' AND ev.nombre = 'La Equidad';

    INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
    SELECT l.id, el.id, ev.id, '2026-09-07 20:00:00', 'finalizado'
    FROM Liga l, Equipo el, Equipo ev
    WHERE l.nombre = 'Liga BetPlay'
      AND el.nombre = 'Santa Fe' AND ev.nombre = 'Deportivo Cali';

    INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
    SELECT l.id, el.id, ev.id, '2026-09-08 21:30:00', 'finalizado'
    FROM Liga l, Equipo el, Equipo ev
    WHERE l.nombre = 'NBA'
      AND el.nombre = 'Boston Celtics' AND ev.nombre = 'Golden State Warriors';
END
GO

-- Login (bitacora): garantizar 5 intentos
IF (SELECT COUNT(*) FROM dbo.Login) < 5
BEGIN
    INSERT INTO Login (usuario_id, ip, exitoso)
    SELECT u.id, '192.168.1.20', 1 FROM Usuario u WHERE u.correo = 'jhon@apuestadb.com'
    UNION ALL
    SELECT u.id, '192.168.1.21', 1 FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, '192.168.1.22', 0 FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, '192.168.1.23', 1 FROM Usuario u WHERE u.correo = 'jhon@apuestadb.com';
END
GO

-- SaldoCuenta: garantizar 5 (por si se corre sobre BD recien sembrada)
IF (SELECT COUNT(*) FROM dbo.SaldoCuenta) < 5
BEGIN
    INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
    SELECT u.id, ts.id, 50000.00, 'activa'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'laura.gomez@apuestadb.com' AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, ts.id, 20000.00, 'activa'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'laura.gomez@apuestadb.com' AND ts.nombre = 'pse'
    UNION ALL
    SELECT u.id, ts.id, 30000.00, 'activa'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'andres.torres@apuestadb.com' AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, ts.id, 15000.00, 'activa'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'andres.torres@apuestadb.com' AND ts.nombre = 'pse'
    UNION ALL
    SELECT u.id, ts.id, 10000.00, 'activa'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'valentina.castro@apuestadb.com' AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, ts.id, 5000.00, 'activa'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'valentina.castro@apuestadb.com' AND ts.nombre = 'pse';
END
GO

-- Saldos de los usuarios demo (idempotente por usuario+tipo; se ejecuta siempre)
INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
SELECT u.id, ts.id, 50000.00, 'activa'
FROM Usuario u, TipoSaldo ts
WHERE u.correo = 'laura.gomez@apuestadb.com' AND ts.nombre = 'tokens'
  AND NOT EXISTS (SELECT 1 FROM SaldoCuenta sc WHERE sc.usuario_id = u.id AND sc.tipo_saldo_id = ts.id);

INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
SELECT u.id, ts.id, 20000.00, 'activa'
FROM Usuario u, TipoSaldo ts
WHERE u.correo = 'laura.gomez@apuestadb.com' AND ts.nombre = 'pse'
  AND NOT EXISTS (SELECT 1 FROM SaldoCuenta sc WHERE sc.usuario_id = u.id AND sc.tipo_saldo_id = ts.id);

INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
SELECT u.id, ts.id, 30000.00, 'activa'
FROM Usuario u, TipoSaldo ts
WHERE u.correo = 'andres.torres@apuestadb.com' AND ts.nombre = 'tokens'
  AND NOT EXISTS (SELECT 1 FROM SaldoCuenta sc WHERE sc.usuario_id = u.id AND sc.tipo_saldo_id = ts.id);

INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
SELECT u.id, ts.id, 15000.00, 'activa'
FROM Usuario u, TipoSaldo ts
WHERE u.correo = 'andres.torres@apuestadb.com' AND ts.nombre = 'pse'
  AND NOT EXISTS (SELECT 1 FROM SaldoCuenta sc WHERE sc.usuario_id = u.id AND sc.tipo_saldo_id = ts.id);

INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
SELECT u.id, ts.id, 10000.00, 'activa'
FROM Usuario u, TipoSaldo ts
WHERE u.correo = 'valentina.castro@apuestadb.com' AND ts.nombre = 'tokens'
  AND NOT EXISTS (SELECT 1 FROM SaldoCuenta sc WHERE sc.usuario_id = u.id AND sc.tipo_saldo_id = ts.id);

INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo, estado)
SELECT u.id, ts.id, 5000.00, 'activa'
FROM Usuario u, TipoSaldo ts
WHERE u.correo = 'valentina.castro@apuestadb.com' AND ts.nombre = 'pse'
  AND NOT EXISTS (SELECT 1 FROM SaldoCuenta sc WHERE sc.usuario_id = u.id AND sc.tipo_saldo_id = ts.id);
GO

-- HacerApuesta: el seed deja 1; se agregan 4 (usuarios jhon/shantal siempre existen)
IF (SELECT COUNT(*) FROM dbo.HacerApuesta) < 5
BEGIN
    INSERT INTO HacerApuesta (usuario_id, apuesta_id, tipo_saldo_id, monto, cuota_aceptada, estado, fecha)
    SELECT u.id, a.id, ts.id, 15000.00, a.cuota, 'pendiente', '2026-09-02 12:00:00'
    FROM Usuario u, Apuestas a, TipoSaldo ts
    WHERE u.correo = 'shantal@apuestadb.com' AND a.id = 4 AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, a.id, ts.id, 8000.00, a.cuota, 'perdida', '2026-08-29 15:00:00'
    FROM Usuario u, Apuestas a, TipoSaldo ts
    WHERE u.correo = 'jhon@apuestadb.com' AND a.id = 3 AND ts.nombre = 'pse'
    UNION ALL
    SELECT u.id, a.id, ts.id, 20000.00, a.cuota, 'ganada', '2026-08-25 19:00:00'
    FROM Usuario u, Apuestas a, TipoSaldo ts
    WHERE u.correo = 'shantal@apuestadb.com' AND a.id = 2 AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, a.id, ts.id, 12000.00, a.cuota, 'pendiente', '2026-09-02 16:30:00'
    FROM Usuario u, Apuestas a, TipoSaldo ts
    WHERE u.correo = 'shantal@apuestadb.com' AND a.id = 5 AND ts.nombre = 'pse';
END
GO

-- LogPago: el seed deja 4; se agrega 1 mas (o mas si la tabla viene vacia)
IF (SELECT COUNT(*) FROM dbo.LogPago) < 5
BEGIN
    INSERT INTO LogPago (usuario_id, tipo_saldo_id, tipo, monto, saldo_resultante, hacer_apuesta_id, fecha)
    SELECT u.id, ts.id, 'recarga', 30000.00, 30000.00, NULL, '2026-09-01 08:00:00'
    FROM Usuario u, TipoSaldo ts
    WHERE u.correo = 'jhon@apuestadb.com' AND ts.nombre = 'tokens';

    IF (SELECT COUNT(*) FROM dbo.LogPago) < 5
    BEGIN
        INSERT INTO LogPago (usuario_id, tipo_saldo_id, tipo, monto, saldo_resultante, hacer_apuesta_id, fecha)
        SELECT u.id, ts.id, 'ajuste', -2000.00, 28000.00, NULL, '2026-09-01 09:00:00'
        FROM Usuario u, TipoSaldo ts
        WHERE u.correo = 'jhon@apuestadb.com' AND ts.nombre = 'tokens';
    END
END
GO

-- Resultado: el seed deja 1; se agregan 4 (sobre los partidos finalizados nuevos)
IF (SELECT COUNT(*) FROM dbo.Resultado) < 5
BEGIN
    INSERT INTO Resultado (calendario_id, marcador_local, marcador_visitante, ganador)
    SELECT c.id, 112, 98, 'local'
    FROM Calendario c JOIN Equipo e ON e.id = c.equipo_local_id
    WHERE e.nombre = 'Golden State Warriors' AND c.estado = 'finalizado';

    INSERT INTO Resultado (calendario_id, marcador_local, marcador_visitante, ganador)
    SELECT c.id, 2, 0, 'local'
    FROM Calendario c JOIN Equipo e ON e.id = c.equipo_local_id
    WHERE e.nombre = 'Junior' AND c.estado = 'finalizado'
      AND c.equipo_visitante_id = (SELECT id FROM Equipo WHERE nombre = 'La Equidad');

    INSERT INTO Resultado (calendario_id, marcador_local, marcador_visitante, ganador)
    SELECT c.id, 1, 1, 'empate'
    FROM Calendario c JOIN Equipo e ON e.id = c.equipo_local_id
    WHERE e.nombre = 'Santa Fe' AND c.estado = 'finalizado'
      AND c.equipo_visitante_id = (SELECT id FROM Equipo WHERE nombre = 'Deportivo Cali');

    INSERT INTO Resultado (calendario_id, marcador_local, marcador_visitante, ganador)
    SELECT c.id, 90, 95, 'visitante'
    FROM Calendario c JOIN Equipo e ON e.id = c.equipo_local_id
    WHERE e.nombre = 'Boston Celtics' AND c.estado = 'finalizado'
      AND c.equipo_visitante_id = (SELECT id FROM Equipo WHERE nombre = 'Golden State Warriors');
END
GO

-- CalendarioArbitro (relacion N:M)
IF (SELECT COUNT(*) FROM dbo.CalendarioArbitro) < 5
BEGIN
    INSERT INTO CalendarioArbitro (calendario_id, arbitro_id, rol)
    SELECT TOP 5 c.id, a.id, 'central'
    FROM Calendario c, Arbitro a
    WHERE NOT EXISTS (SELECT 1 FROM CalendarioArbitro ca WHERE ca.calendario_id = c.id AND ca.arbitro_id = a.id)
    ORDER BY c.id, a.id;
END
GO

-- HistorialCuota
IF (SELECT COUNT(*) FROM dbo.HistorialCuota) < 5
BEGIN
    INSERT INTO HistorialCuota (apuesta_id, usuario_id, cuota_anterior, cuota_nueva, fecha_cambio)
    SELECT a.id, (SELECT id FROM Usuario WHERE correo = 'jhon@apuestadb.com'), a.cuota - 0.20, a.cuota, '2026-08-31 10:00:00'
    FROM Apuestas a WHERE a.id = 4
    UNION ALL
    SELECT a.id, (SELECT id FROM Usuario WHERE correo = 'jhon@apuestadb.com'), a.cuota, a.cuota + 0.15, '2026-08-31 11:00:00'
    FROM Apuestas a WHERE a.id = 5
    UNION ALL
    SELECT a.id, (SELECT id FROM Usuario WHERE correo = 'jhon@apuestadb.com'), NULL, a.cuota, '2026-08-30 09:00:00'
    FROM Apuestas a WHERE a.id = 6
    UNION ALL
    SELECT a.id, (SELECT id FROM Usuario WHERE correo = 'jhon@apuestadb.com'), a.cuota - 0.10, a.cuota, '2026-08-29 14:00:00'
    FROM Apuestas a WHERE a.id = 2
    UNION ALL
    SELECT a.id, (SELECT id FROM Usuario WHERE correo = 'jhon@apuestadb.com'), a.cuota, a.cuota + 0.05, '2026-08-28 16:00:00'
    FROM Apuestas a WHERE a.id = 3;
END
GO

-- Recarga
IF (SELECT COUNT(*) FROM dbo.Recarga) < 5
BEGIN
    INSERT INTO Recarga (usuario_id, tipo_saldo_id, monto, estado, fecha_solicitud, fecha_aprobacion)
    SELECT u.id, ts.id, 50000.00, 'aprobada', '2026-08-28 09:00:00', '2026-08-28 09:01:00'
    FROM Usuario u, TipoSaldo ts WHERE u.correo = 'shantal@apuestadb.com' AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, ts.id, 20000.00, 'aprobada', '2026-08-28 09:05:00', '2026-08-28 09:06:00'
    FROM Usuario u, TipoSaldo ts WHERE u.correo = 'shantal@apuestadb.com' AND ts.nombre = 'pse'
    UNION ALL
    SELECT u.id, ts.id, 30000.00, 'pendiente', '2026-09-02 10:00:00', NULL
    FROM Usuario u, TipoSaldo ts WHERE u.correo = 'jhon@apuestadb.com' AND ts.nombre = 'tokens'
    UNION ALL
    SELECT u.id, ts.id, 15000.00, 'rechazada', '2026-08-27 18:00:00', '2026-08-27 18:30:00'
    FROM Usuario u, TipoSaldo ts WHERE u.correo = 'jhon@apuestadb.com' AND ts.nombre = 'pse'
    UNION ALL
    SELECT u.id, ts.id, 25000.00, 'aprobada', '2026-08-26 20:00:00', '2026-08-26 20:05:00'
    FROM Usuario u, TipoSaldo ts WHERE u.correo = 'shantal@apuestadb.com' AND ts.nombre = 'pse';
END
GO

-- Notificacion
IF (SELECT COUNT(*) FROM dbo.Notificacion) < 5
BEGIN
    INSERT INTO Notificacion (usuario_id, tipo, mensaje, leida, fecha)
    SELECT u.id, 'resultado', 'Tu apuesta gano: premio abonado a tokens.', 0, '2026-09-01 21:35:00'
    FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, 'apuesta', 'Nueva apuesta registrada correctamente.', 1, '2026-09-02 12:01:00'
    FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, 'sistema', 'Bienvenido al sandbox academico ApuestaDB.', 0, '2026-08-28 09:02:00'
    FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, 'promocion', 'Recarga tokens y recibe bonos ficticios.', 0, '2026-09-02 08:00:00'
    FROM Usuario u WHERE u.correo = 'jhon@apuestadb.com'
    UNION ALL
    SELECT u.id, 'sistema', 'Recuerda: todo el saldo es ficticio.', 1, '2026-08-25 10:00:00'
    FROM Usuario u WHERE u.correo = 'jhon@apuestadb.com';
END
GO

-- FavoritoEquipo
IF (SELECT COUNT(*) FROM dbo.FavoritoEquipo) < 5
BEGIN
    INSERT INTO FavoritoEquipo (usuario_id, equipo_id)
    SELECT u.id, e.id FROM Usuario u, Equipo e
    WHERE u.correo = 'shantal@apuestadb.com' AND e.nombre = 'Atletico Nacional'
    UNION ALL
    SELECT u.id, e.id FROM Usuario u, Equipo e
    WHERE u.correo = 'shantal@apuestadb.com' AND e.nombre = 'Junior'
    UNION ALL
    SELECT u.id, e.id FROM Usuario u, Equipo e
    WHERE u.correo = 'jhon@apuestadb.com' AND e.nombre = 'Millonarios'
    UNION ALL
    SELECT u.id, e.id FROM Usuario u, Equipo e
    WHERE u.correo = 'jhon@apuestadb.com' AND e.nombre = 'Boston Celtics'
    UNION ALL
    SELECT u.id, e.id FROM Usuario u, Equipo e
    WHERE u.correo = 'shantal@apuestadb.com' AND e.nombre = 'Santa Fe';
END
GO

-- PreguntaSeguridad
IF (SELECT COUNT(*) FROM dbo.PreguntaSeguridad) < 5
BEGIN
    INSERT INTO PreguntaSeguridad (pregunta, estado) VALUES
        ('Cual es el nombre de tu primera mascota?', 'activo'),
        ('En que ciudad naciste?', 'activo'),
        ('Cual es tu equipo favorito?', 'activo'),
        ('Cual fue tu primer colegio?', 'activo'),
        ('Cual es el segundo apellido de tu madre?', 'activo');
END
GO

-- RespuestaSeguridad (respuestas ficticias de demostracion)
IF (SELECT COUNT(*) FROM dbo.RespuestaSeguridad) < 5
BEGIN
    INSERT INTO RespuestaSeguridad (usuario_id, pregunta_id, respuesta)
    SELECT u.id, p.id, 'Rex' FROM Usuario u, PreguntaSeguridad p
    WHERE u.correo = 'shantal@apuestadb.com' AND p.pregunta LIKE '%mascota%'
    UNION ALL
    SELECT u.id, p.id, 'Medellin' FROM Usuario u, PreguntaSeguridad p
    WHERE u.correo = 'shantal@apuestadb.com' AND p.pregunta LIKE '%ciudad naciste%'
    UNION ALL
    SELECT u.id, p.id, 'Nacional' FROM Usuario u, PreguntaSeguridad p
    WHERE u.correo = 'jhon@apuestadb.com' AND p.pregunta LIKE '%equipo favorito%'
    UNION ALL
    SELECT u.id, p.id, 'El Rosario' FROM Usuario u, PreguntaSeguridad p
    WHERE u.correo = 'jhon@apuestadb.com' AND p.pregunta LIKE '%colegio%'
    UNION ALL
    SELECT u.id, p.id, 'Garcia' FROM Usuario u, PreguntaSeguridad p
    WHERE u.correo = 'shantal@apuestadb.com' AND p.pregunta LIKE '%madre%';
END
GO

-- Auditoria
IF (SELECT COUNT(*) FROM dbo.Auditoria) < 5
BEGIN
    INSERT INTO Auditoria (usuario_id, tabla_afectada, operacion, detalle, fecha)
    SELECT u.id, 'Login', 'LOGIN', 'Inicio de sesion exitoso', '2026-09-02 10:00:00'
    FROM Usuario u WHERE u.correo = 'jhon@apuestadb.com'
    UNION ALL
    SELECT u.id, 'Usuario', 'INSERT', 'Registro de usuario desde la web', '2026-08-28 09:00:00'
    FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, 'HacerApuesta', 'INSERT', 'Apuesta registrada por el cliente', '2026-08-30 10:00:00'
    FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com'
    UNION ALL
    SELECT u.id, 'Resultado', 'INSERT', 'Resultado oficial del partido', '2026-09-01 21:30:00'
    FROM Usuario u WHERE u.correo = 'jhon@apuestadb.com'
    UNION ALL
    SELECT u.id, 'Recarga', 'INSERT', 'Solicitud de recarga aprobada', '2026-08-28 09:01:00'
    FROM Usuario u WHERE u.correo = 'shantal@apuestadb.com';
END
GO

-- ============================================================================
-- VERIFICACION: total de tablas y filas minimas (deben ser 29 tablas, >= 5 filas)
-- ============================================================================
SELECT t.name AS tabla, SUM(p.rows) AS filas
FROM sys.tables t
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
GROUP BY t.name
ORDER BY t.name;
GO
