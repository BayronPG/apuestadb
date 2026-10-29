/* ============================================================================
   APUESTADB - 06_demo_data.sql      (Fase 12.1 - datos de prueba completos)
   ----------------------------------------------------------------------------
   Objetivo : poblar la base con un dataset coherente de una casa de apuestas
              deportiva simulada, para demostracion y sustentacion.
   Requiere : database/01_database, 02_tables, 03_constraints, 04_indexes y
              05_seed_data; se recomienda tener cargados functions/, views/,
              procedures/ y triggers/ (los triggers validan estos datos).
   Idempotente: si los usuarios de demostracion ya existen, el script no
              vuelve a insertar nada.
   ----------------------------------------------------------------------------
   TABLAS QUE NO ALCANZAN 5 FILAS POR RESTRICCION CHECK (justificacion):
     - Rol (2)                 -> CK_Rol_nombre: 'usuario' | 'administrador'.
     - TipoSaldo (2)           -> CK_TipoSaldo_nombre: 'tokens' | 'PSE'.
     - TipoMovimientoSaldo (4) -> CK_TipoMovimientoSaldo_nombre: 4 valores.
     - OpcionApuesta           -> CK_OpcionApuesta_etiqueta: maximo 3 opciones
                                  (local | empate | visitante) por mercado.
   Es decir: son catalogos de dominio cerrado; el modelo no admite mas filas.
   ----------------------------------------------------------------------------
   CREDENCIAL DE DEMOSTRACION: los 6 usuarios @apuestadb.co reutilizan la
   credencial (hash bcrypt) de los usuarios de prueba creados en la Fase 12
   (admin@apuestadb.local / usuario@apuestadb.local). El valor en claro NO se
   versiona: lo administra Jhon.
   NOTA: datos ficticios. No hay dinero real ni pasarelas de pago.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ==========================================================================
   Bloque unico de carga (guardado por idempotencia).
   ========================================================================== */
DECLARE @cargado BIT = 0;
IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE correo = N'andres.restrepo@apuestadb.co') SET @cargado = 1;

IF @cargado = 1
BEGIN
    PRINT N'06_demo_data.sql: los datos de demostracion ya estan cargados (script idempotente).';
    RETURN;
END

PRINT N'06_demo_data.sql: cargando datos de demostracion...';

/* Credencial de referencia: se copia el hash de los usuarios de la Fase 12
   (el valor en claro no se versiona). */
DECLARE @hash_demo VARCHAR(255) =
    (SELECT TOP 1 contrasena FROM dbo.Usuario WHERE correo = N'usuario@apuestadb.local');
IF @hash_demo IS NULL SET @hash_demo = (SELECT TOP 1 contrasena FROM dbo.Usuario ORDER BY id_usuario);
IF @hash_demo IS NULL
    THROW 50099, N'No hay una credencial demo de referencia: ejecute 05_seed_data.sql o cree un usuario.', 1;

/* ==========================================================================
   1. CATALOGO GEOGRAFICO
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Pais WHERE nombre = N'Espana')
    INSERT INTO dbo.Pais (nombre, codigo)
    SELECT v.nombre, v.codigo
    FROM (VALUES (N'Espana','ES'), (N'Inglaterra','GB'), (N'Italia','IT'),
                 (N'Estados Unidos','US'), (N'Argentina','AR')) v(nombre, codigo)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Pais p WHERE p.nombre = v.nombre);

IF NOT EXISTS (SELECT 1 FROM dbo.Ciudad WHERE nombre = N'Bogota')
    INSERT INTO dbo.Ciudad (id_pais, nombre, region)
    SELECT p.id_pais, v.nombre, v.region
    FROM (VALUES (N'Colombia', N'Bogota',      N'Cundinamarca'),
                 (N'Colombia', N'Cali',        N'Valle del Cauca'),
                 (N'Colombia', N'Barranquilla',N'Atlantico'),
                 (N'Espana',   N'Madrid',      N'Comunidad de Madrid'),
                 (N'Espana',   N'Barcelona',   N'Cataluna'),
                 (N'Inglaterra', N'Manchester', N'Inglaterra'),
                 (N'Inglaterra', N'Liverpool',  N'Inglaterra'),
                 (N'Italia',   N'Milan',       N'Lombardia'),
                 (N'Estados Unidos', N'Los Angeles', N'California'),
                 (N'Estados Unidos', N'Miami', N'Florida'),
                 (N'Argentina', N'Buenos Aires', N'CABA')) v(pais, nombre, region)
    JOIN dbo.Pais p ON p.nombre = v.pais
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Ciudad c WHERE c.id_pais = p.id_pais AND c.nombre = v.nombre);

IF NOT EXISTS (SELECT 1 FROM dbo.Estadio WHERE nombre = N'El Campin')
    INSERT INTO dbo.Estadio (id_ciudad, nombre, capacidad, direccion)
    SELECT c.id_ciudad, v.nombre, v.capacidad, v.direccion
    FROM (VALUES (N'Bogota',       N'El Campin',                  36000, N'Calle 57 # 40-20'),
                 (N'Cali',         N'Pascual Guerrero',          35000, N'Carrera 36 # 5-50'),
                 (N'Barranquilla', N'Metropolitano Roberto Melendez', 46692, N'Carrera 53 # 80-100'),
                 (N'Madrid',       N'Santiago Bernabeu',         81044, N'Concha Espina 1'),
                 (N'Barcelona',    N'Spotify Camp Nou',          99354, N'Aristides Maillol 12'),
                 (N'Manchester',   N'Old Trafford',              74310, N'Sir Matt Busby Way'),
                 (N'Liverpool',    N'Anfield',                   53394, N'Anfield Road'),
                 (N'Milan',        N'San Siro',                  75923, N'Via Piccolomini 5'),
                 (N'Los Angeles',  N'Crypto.com Arena',          20000, N'1111 S Figueroa St'),
                 (N'Miami',        N'Kaseya Center',             19600, N'601 Biscayne Blvd'),
                 (N'Buenos Aires', N'La Bombonera',              54000, N'Brandsen 805')) v(ciudad, nombre, capacidad, direccion)
    JOIN dbo.Ciudad c ON c.nombre = v.ciudad
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Estadio e WHERE e.id_ciudad = c.id_ciudad AND e.nombre = v.nombre);

/* ==========================================================================
   2. CATALOGO DEPORTIVO
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Deporte WHERE nombre = N'Baloncesto')
    INSERT INTO dbo.Deporte (nombre, descripcion, estado)
    SELECT v.nombre, v.descripcion, 'vigente'
    FROM (VALUES (N'Baloncesto', N'Deporte de equipo con canasta y tablero.'),
                 (N'Tenis',      N'Deporte de raqueta individual o de parejas.'),
                 (N'Beisbol',    N'Deporte de equipo de bate y guante.'),
                 (N'Voleibol',   N'Deporte de equipo con red y saque.'),
                 (N'Ciclismo',   N'Deporte de ruta y pista por etapas.')) v(nombre, descripcion)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Deporte d WHERE d.nombre = v.nombre);

IF NOT EXISTS (SELECT 1 FROM dbo.Liga WHERE nombre = N'LaLiga EA Sports')
    INSERT INTO dbo.Liga (id_deporte, nombre, categoria, estado)
    SELECT d.id_deporte, v.nombre, v.categoria, 'vigente'
    FROM (VALUES (N'Futbol', N'LaLiga EA Sports', N'Primera Division'),
                 (N'Futbol', N'Premier League',   N'Primera Division'),
                 (N'Futbol', N'Serie A',          N'Primera Division'),
                 (N'Futbol', N'Bundesliga',       N'Primera Division'),
                 (N'Baloncesto', N'NBA',          N'Profesional')) v(deporte, nombre, categoria)
    JOIN dbo.Deporte d ON d.nombre = v.deporte
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Liga l WHERE l.id_deporte = d.id_deporte AND l.nombre = v.nombre);

IF NOT EXISTS (SELECT 1 FROM dbo.Temporada WHERE etiqueta = N'2026-II')
    INSERT INTO dbo.Temporada (id_liga, etiqueta, fecha_inicio, fecha_fin, estado)
    SELECT l.id_liga, v.etiqueta, v.inicio, v.fin, 'en_curso'
    FROM (VALUES (N'Liga BetPlay Dimayor', N'2026-II', '2026-07-01', '2026-12-15'),
                 (N'LaLiga EA Sports',     N'2026-27', '2026-08-15', '2027-05-30'),
                 (N'Premier League',       N'2026-27', '2026-08-14', '2027-05-24'),
                 (N'Serie A',              N'2026-27', '2026-08-22', '2027-05-31'),
                 (N'Bundesliga',           N'2026-27', '2026-08-21', '2027-05-16'),
                 (N'NBA',                  N'2026-27', '2026-10-01', '2027-06-15')) v(liga, etiqueta, inicio, fin)
    JOIN dbo.Liga l ON l.nombre = v.liga
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Temporada t WHERE t.id_liga = l.id_liga AND t.etiqueta = v.etiqueta);

IF NOT EXISTS (SELECT 1 FROM dbo.Equipo WHERE nombre = N'Millonarios')
    INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
    SELECT d.id_deporte, c.id_ciudad, v.nombre, v.siglas, CONVERT(DATE, v.fundacion), 'vigente'
    FROM (VALUES (N'Millonarios',      N'Bogota',        N'MIL', '1946-06-18'),
                 (N'America de Cali',  N'Cali',          N'AME', '1927-02-13'),
                 (N'Junior de Barranquilla', N'Barranquilla', N'JUN', '1924-08-07'),
                 (N'Real Madrid',      N'Madrid',        N'RMA', '1902-03-06'),
                 (N'FC Barcelona',     N'Barcelona',     N'FCB', '1899-11-29'),
                 (N'Manchester United',N'Manchester',    N'MUN', '1878-01-01'),
                 (N'Liverpool FC',     N'Liverpool',     N'LIV', '1892-06-03'),
                 (N'AC Milan',         N'Milan',         N'ACM', '1899-12-16'),
                 (N'Inter de Milan',   N'Milan',         N'INT', '1908-03-09'),
                 (N'Los Angeles Lakers',N'Los Angeles',  N'LAL', '1947-01-01'),
                 (N'Miami Heat',       N'Miami',         N'MIA', '1988-01-01')) v(nombre, ciudad, siglas, fundacion)
    JOIN dbo.Ciudad c ON c.nombre = v.ciudad
    JOIN dbo.Deporte d ON d.nombre = CASE WHEN v.nombre IN (N'Los Angeles Lakers', N'Miami Heat') THEN N'Baloncesto' ELSE N'Futbol' END
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Equipo e WHERE e.nombre = v.nombre);

IF NOT EXISTS (SELECT 1 FROM dbo.Arbitro WHERE apellidos = N'Roldan')
    INSERT INTO dbo.Arbitro (nombres, apellidos, categoria, estado)
    SELECT v.nombres, v.apellidos, v.categoria, 'vigente'
    FROM (VALUES (N'Wilmar', 'Roldan',   N'FIFA'),
                 (N'Andres', 'Rojas',    N'FIFA'),
                 (N'Nicolas','Gallo',    N'FIFA'),
                 (N'Jose',   'Buitrago', N'Nacional'),
                 (N'Carlos', 'Betancur', N'Nacional'),
                 (N'Piero',  'Maza',     N'FIFA')) v(nombres, apellidos, categoria)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Arbitro a WHERE a.nombres = v.nombres AND a.apellidos = v.apellidos);

/* ==========================================================================
   3. SEGURIDAD Y USUARIOS
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.PreguntaSeguridad)
    INSERT INTO dbo.PreguntaSeguridad (enunciado, estado)
    SELECT v.enunciado, 'vigente'
    FROM (VALUES (N'Cual es el nombre de tu primera mascota?'),
                 (N'En que ciudad nacio tu madre?'),
                 (N'Cual es el nombre de tu colegio de primaria?'),
                 (N'Cual fue tu primer equipo de futbol favorito?'),
                 (N'Cual es tu comida favorita de la infancia?'),
                 (N'Cual es el nombre de tu mejor amigo de la infancia?')) v(enunciado)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.PreguntaSeguridad p WHERE p.enunciado = v.enunciado);

IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE correo = N'andres.restrepo@apuestadb.co')
    INSERT INTO dbo.Usuario (id_rol, nombres, apellidos, correo, contrasena, telefono, estado, fecha_registro)
    SELECT (SELECT id_rol FROM dbo.Rol WHERE nombre = 'usuario'),
           v.nombres, v.apellidos, v.correo, @hash_demo, v.telefono, 'activo',
           CONVERT(DATETIME2(3), v.fecha)
    FROM (VALUES (N'Andres Felipe', 'Restrepo Gomez',  N'andres.restrepo@apuestadb.co',  N'+573001112233', '2026-07-01T09:15:00'),
                 (N'Laura Sofia',   'Cardenas Ruiz',   N'laura.cardenas@apuestadb.co',   N'+573004445566', '2026-07-02T10:40:00'),
                 (N'Sebastian',     'Gomez Alvarez',   N'sebastian.gomez@apuestadb.co',  N'+573007778899', '2026-07-05T16:05:00'),
                 (N'Valentina',     'Torres Bedoya',   N'valentina.torres@apuestadb.co', N'+573101112244', '2026-07-08T11:25:00'),
                 (N'Camilo Andres', 'Uribe Salazar',   N'camilo.uribe@apuestadb.co',     N'+573103335577', '2026-07-12T14:50:00'),
                 (N'Daniela Maria', 'Ospina Velez',    N'daniela.ospina@apuestadb.co',   N'+573106668800', '2026-07-15T19:30:00')) v(nombres, apellidos, correo, telefono, fecha)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Usuario u WHERE u.correo = v.correo);

/* Cuentas de saldo (tokens y PSE) para los 6 usuarios de demostracion (RN-02). */
IF NOT EXISTS (SELECT 1 FROM dbo.SaldoCuenta sc
               JOIN dbo.Usuario u ON u.id_usuario = sc.id_usuario
               WHERE u.correo = N'andres.restrepo@apuestadb.co')
    INSERT INTO dbo.SaldoCuenta (id_usuario, id_tipo_saldo, saldo_actual, fecha_ultima_actualizacion)
    SELECT u.id_usuario, ts.id_tipo_saldo, 0, SYSDATETIME()
    FROM dbo.Usuario u
    CROSS JOIN dbo.TipoSaldo ts
    WHERE u.correo IN (N'andres.restrepo@apuestadb.co', N'laura.cardenas@apuestadb.co',
                       N'sebastian.gomez@apuestadb.co', N'valentina.torres@apuestadb.co',
                       N'camilo.uribe@apuestadb.co', N'daniela.ospina@apuestadb.co')
      AND NOT EXISTS (SELECT 1 FROM dbo.SaldoCuenta sc
                      WHERE sc.id_usuario = u.id_usuario AND sc.id_tipo_saldo = ts.id_tipo_saldo);

IF NOT EXISTS (SELECT 1 FROM dbo.RespuestaSeguridad)
    INSERT INTO dbo.RespuestaSeguridad (id_usuario, id_pregunta, respuesta, fecha_registro)
    SELECT u.id_usuario, p.id_pregunta, v.respuesta, CONVERT(DATETIME2(3), u.fecha_registro)
    FROM (VALUES (N'andres.restrepo@apuestadb.co',  1, 'Firulais'),
                 (N'laura.cardenas@apuestadb.co',   2, 'Medellin'),
                 (N'sebastian.gomez@apuestadb.co',  3, 'Colegio San Jose'),
                 (N'valentina.torres@apuestadb.co', 4, 'Atletico Nacional'),
                 (N'camilo.uribe@apuestadb.co',     5, 'Bandeja paisa'),
                 (N'daniela.ospina@apuestadb.co',   6, 'Carolina')) v(correo, n_pregunta, respuesta)
    JOIN dbo.Usuario u ON u.correo = v.correo
    JOIN (SELECT ROW_NUMBER() OVER (ORDER BY id_pregunta) AS n_pregunta, id_pregunta FROM dbo.PreguntaSeguridad) p
      ON p.n_pregunta = v.n_pregunta
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RespuestaSeguridad r
                      WHERE r.id_usuario = u.id_usuario AND r.id_pregunta = p.id_pregunta);

IF NOT EXISTS (SELECT 1 FROM dbo.TokenRecuperacion WHERE valor_token = N'demotoken0001andres')
BEGIN
    INSERT INTO dbo.TokenRecuperacion (id_usuario, valor_token, fecha_emision, fecha_expiracion, estado)
    SELECT u.id_usuario, v.valor_token,
           DATEADD(MINUTE, v.minutos_emision, CAST(GETDATE() AS DATETIME2(3))),
           DATEADD(MINUTE, v.minutos_expiracion, CAST(GETDATE() AS DATETIME2(3))),
           v.estado
    FROM (VALUES (N'andres.restrepo@apuestadb.co',  N'demotoken0001andres',   -60,  -30, 'expirado'),
                 (N'laura.cardenas@apuestadb.co',   N'demotoken0002laura',    -45,  -15, 'expirado'),
                 (N'sebastian.gomez@apuestadb.co',  N'demotoken0003sebas',   -240, -180, 'usado'),
                 (N'valentina.torres@apuestadb.co', N'demotoken0004valen',   -120,  -60, 'usado'),
                 (N'camilo.uribe@apuestadb.co',     N'demotoken0005camilo',    -10,   20, 'vigente'),
                 (N'daniela.ospina@apuestadb.co',   N'demotoken0006dani',       -5,   25, 'vigente')) v(correo, valor_token, minutos_emision, minutos_expiracion, estado)
    JOIN dbo.Usuario u ON u.correo = v.correo;
END

/* ==========================================================================
   4. CALENDARIO, MERCADOS Y CUOTAS
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE descripcion = N'Clasico capitalino - fecha 3')
    INSERT INTO dbo.Evento (id_temporada, id_equipo_local, id_equipo_visitante, id_estadio, fecha_hora_inicio, estado, descripcion)
    SELECT t.id_temporada, el.id_equipo, ev.id_equipo, es.id_estadio,
           CONVERT(DATETIME2(3), v.fecha), v.estado, v.descripcion
    FROM (VALUES (N'Liga BetPlay Dimayor', N'2026-II', N'Atletico Nacional',      N'Millonarios',            N'Atanasio Girardot', '2026-07-12T19:30:00', 'finalizado', N'Clasico capitalino - fecha 3'),
                 (N'Liga BetPlay Dimayor', N'2026-II', N'America de Cali',         N'Junior de Barranquilla', N'Pascual Guerrero',  '2026-07-19T18:00:00', 'finalizado', N'Fecha 4 - Liga BetPlay'),
                 (N'Liga BetPlay Dimayor', N'2026-II', N'Independiente Medellin',  N'Atletico Nacional',      N'Atanasio Girardot', '2026-07-26T20:00:00', 'finalizado', N'Clasico paisa - fecha 5'),
                 (N'LaLiga EA Sports',     N'2026-27', N'Real Madrid',             N'FC Barcelona',           N'Santiago Bernabeu', '2026-09-05T21:00:00', 'finalizado', N'El Clasico - jornada 3'),
                 (N'Premier League',       N'2026-27', N'Manchester United',       N'Liverpool FC',           N'Old Trafford',      '2026-09-06T17:30:00', 'finalizado', N'North West Derby - jornada 4'),
                 (N'Serie A',              N'2026-27', N'AC Milan',                N'Inter de Milan',         N'San Siro',          '2026-09-12T20:45:00', 'finalizado', N'Derby della Madonnina - jornada 3'),
                 (N'Liga BetPlay Dimayor', N'2026-II', N'Millonarios',             N'America de Cali',        N'El Campin',         '2026-09-20T20:00:00', 'programado', N'Fecha 8 - Liga BetPlay'),
                 (N'LaLiga EA Sports',     N'2026-27', N'FC Barcelona',            N'Real Madrid',            N'Spotify Camp Nou',  '2026-10-04T21:00:00', 'programado', N'El Clasico de vuelta - jornada 8')) v(liga, etiqueta, local, visitante, estadio, fecha, estado, descripcion)
    JOIN dbo.Liga l ON l.nombre = v.liga
    JOIN dbo.Temporada t ON t.id_liga = l.id_liga AND t.etiqueta = v.etiqueta
    JOIN dbo.Equipo el ON el.nombre = v.local
    JOIN dbo.Equipo ev ON ev.nombre = v.visitante
    JOIN dbo.Estadio es ON es.nombre = v.estadio
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Evento e WHERE e.descripcion = v.descripcion);

IF NOT EXISTS (SELECT 1 FROM dbo.CalendarioArbitro)
    INSERT INTO dbo.CalendarioArbitro (id_evento, id_arbitro, rol_arbitro, fecha_designacion)
    SELECT e.id_evento, a.id_arbitro, v.rol, DATEADD(DAY, -3, e.fecha_hora_inicio)
    FROM (VALUES (N'Clasico capitalino - fecha 3',        N'Wilmar', 'Roldan',   'principal'),
                 (N'Clasico capitalino - fecha 3',        N'Andres', 'Rojas',    'asistente'),
                 (N'Fecha 4 - Liga BetPlay',              N'Nicolas','Gallo',    'principal'),
                 (N'Clasico paisa - fecha 5',             N'Jose',   'Buitrago', 'principal'),
                 (N'Clasico paisa - fecha 5',             N'Carlos', 'Betancur', 'asistente'),
                 (N'El Clasico - jornada 3',              N'Piero',  'Maza',     'principal'),
                 (N'North West Derby - jornada 4',        N'Andres', 'Rojas',    'principal'),
                 (N'Derby della Madonnina - jornada 3',   N'Piero',  'Maza',     'asistente'),
                 (N'Fecha 8 - Liga BetPlay',              N'Nicolas','Gallo',    'principal'),
                 (N'El Clasico de vuelta - jornada 8',    N'Carlos', 'Betancur', 'principal')) v(evento, nombres, apellidos, rol)
    JOIN dbo.Evento e ON e.descripcion = v.evento
    JOIN dbo.Arbitro a ON a.nombres = v.nombres AND a.apellidos = v.apellidos
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CalendarioArbitro c
                      WHERE c.id_evento = e.id_evento AND c.id_arbitro = a.id_arbitro);

IF NOT EXISTS (SELECT 1 FROM dbo.Mercado WHERE nombre = N'Resultado final')
    INSERT INTO dbo.Mercado (id_evento, nombre, descripcion, fecha_apertura, fecha_cierre, estado)
    SELECT e.id_evento, N'Resultado final',
           N'Ganador del partido: local, empate o visitante.',
           DATEADD(DAY, -1, e.fecha_hora_inicio),
           DATEADD(MINUTE, -5, e.fecha_hora_inicio),
           CASE WHEN e.estado = 'finalizado' THEN 'cerrado' ELSE 'abierto' END
    FROM dbo.Evento e
    WHERE e.descripcion IN (N'Clasico capitalino - fecha 3', N'Fecha 4 - Liga BetPlay', N'Clasico paisa - fecha 5',
                            N'El Clasico - jornada 3', N'North West Derby - jornada 4', N'Derby della Madonnina - jornada 3',
                            N'Fecha 8 - Liga BetPlay', N'El Clasico de vuelta - jornada 8')
      AND NOT EXISTS (SELECT 1 FROM dbo.Mercado m WHERE m.id_evento = e.id_evento AND m.nombre = N'Resultado final');

/* Opciones (3 por mercado). El trigger trg_OpcionApuesta_HistorialCuota registra el alta. */
IF NOT EXISTS (SELECT 1 FROM dbo.OpcionApuesta o
               JOIN dbo.Mercado m ON m.id_mercado = o.id_mercado
               WHERE m.nombre = N'Resultado final')
    INSERT INTO dbo.OpcionApuesta (id_mercado, etiqueta, cuota_vigente, estado)
    SELECT m.id_mercado, v.etiqueta, v.cuota,
           CASE WHEN m.estado = 'abierto' THEN 'habilitada' ELSE 'deshabilitada' END
    FROM (VALUES (N'Clasico capitalino - fecha 3',      'local',     CAST(1.85 AS DECIMAL(10,2))),
                 (N'Clasico capitalino - fecha 3',      'empate',    CAST(3.40 AS DECIMAL(10,2))),
                 (N'Clasico capitalino - fecha 3',      'visitante', CAST(4.20 AS DECIMAL(10,2))),
                 (N'Fecha 4 - Liga BetPlay',            'local',     CAST(2.10 AS DECIMAL(10,2))),
                 (N'Fecha 4 - Liga BetPlay',            'empate',    CAST(3.10 AS DECIMAL(10,2))),
                 (N'Fecha 4 - Liga BetPlay',            'visitante', CAST(2.90 AS DECIMAL(10,2))),
                 (N'Clasico paisa - fecha 5',           'local',     CAST(2.40 AS DECIMAL(10,2))),
                 (N'Clasico paisa - fecha 5',           'empate',    CAST(3.20 AS DECIMAL(10,2))),
                 (N'Clasico paisa - fecha 5',           'visitante', CAST(2.10 AS DECIMAL(10,2))),
                 (N'El Clasico - jornada 3',            'local',     CAST(1.95 AS DECIMAL(10,2))),
                 (N'El Clasico - jornada 3',            'empate',    CAST(3.60 AS DECIMAL(10,2))),
                 (N'El Clasico - jornada 3',            'visitante', CAST(3.40 AS DECIMAL(10,2))),
                 (N'North West Derby - jornada 4',      'local',     CAST(2.20 AS DECIMAL(10,2))),
                 (N'North West Derby - jornada 4',      'empate',    CAST(3.30 AS DECIMAL(10,2))),
                 (N'North West Derby - jornada 4',      'visitante', CAST(2.30 AS DECIMAL(10,2))),
                 (N'Derby della Madonnina - jornada 3', 'local',     CAST(2.60 AS DECIMAL(10,2))),
                 (N'Derby della Madonnina - jornada 3', 'empate',    CAST(3.10 AS DECIMAL(10,2))),
                 (N'Derby della Madonnina - jornada 3', 'visitante', CAST(2.70 AS DECIMAL(10,2))),
                 (N'Fecha 8 - Liga BetPlay',            'local',     CAST(2.00 AS DECIMAL(10,2))),
                 (N'Fecha 8 - Liga BetPlay',            'empate',    CAST(3.25 AS DECIMAL(10,2))),
                 (N'Fecha 8 - Liga BetPlay',            'visitante', CAST(3.10 AS DECIMAL(10,2))),
                 (N'El Clasico de vuelta - jornada 8',  'local',     CAST(2.15 AS DECIMAL(10,2))),
                 (N'El Clasico de vuelta - jornada 8',  'empate',    CAST(3.55 AS DECIMAL(10,2))),
                 (N'El Clasico de vuelta - jornada 8',  'visitante', CAST(2.45 AS DECIMAL(10,2)))) v(evento, etiqueta, cuota)
    JOIN dbo.Evento e ON e.descripcion = v.evento
    JOIN dbo.Mercado m ON m.id_evento = e.id_evento AND m.nombre = N'Resultado final'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.OpcionApuesta o
                      WHERE o.id_mercado = m.id_mercado AND o.etiqueta = v.etiqueta);

/* Ajustes previos de cuota (historial anterior al alta del trigger). */
IF NOT EXISTS (SELECT 1 FROM dbo.HistorialCuota WHERE motivo = N'Ajuste previo a la apertura (demo)')
    INSERT INTO dbo.HistorialCuota (id_opcion, valor_cuota, fecha_hora_cambio, motivo)
    SELECT o.id_opcion, v.cuota_previa, DATEADD(DAY, -2, SYSDATETIME()), N'Ajuste previo a la apertura (demo)'
    FROM (VALUES (N'El Clasico - jornada 3',            'local',     CAST(1.85 AS DECIMAL(10,2))),
                 (N'North West Derby - jornada 4',      'visitante', CAST(2.45 AS DECIMAL(10,2))),
                 (N'Derby della Madonnina - jornada 3', 'local',     CAST(2.75 AS DECIMAL(10,2)))) v(evento, etiqueta, cuota_previa)
    JOIN dbo.Evento e ON e.descripcion = v.evento
    JOIN dbo.Mercado m ON m.id_evento = e.id_evento AND m.nombre = N'Resultado final'
    JOIN dbo.OpcionApuesta o ON o.id_mercado = m.id_mercado AND o.etiqueta = v.etiqueta;

/* ==========================================================================
   5. RESULTADOS OFICIALES (eventos finalizados)
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Resultado r
               JOIN dbo.Evento e ON e.id_evento = r.id_evento
               WHERE e.descripcion = N'Clasico capitalino - fecha 3')
    INSERT INTO dbo.Resultado (id_evento, marcador_local, marcador_visitante, fecha_registro, estado)
    SELECT e.id_evento, v.ml, v.mv, DATEADD(HOUR, 2, e.fecha_hora_inicio), 'oficial'
    FROM (VALUES (N'Clasico capitalino - fecha 3',        CAST(2 AS SMALLINT), CAST(1 AS SMALLINT)),
                 (N'Fecha 4 - Liga BetPlay',              CAST(1 AS SMALLINT), CAST(1 AS SMALLINT)),
                 (N'Clasico paisa - fecha 5',             CAST(0 AS SMALLINT), CAST(3 AS SMALLINT)),
                 (N'El Clasico - jornada 3',              CAST(3 AS SMALLINT), CAST(2 AS SMALLINT)),
                 (N'North West Derby - jornada 4',        CAST(1 AS SMALLINT), CAST(2 AS SMALLINT)),
                 (N'Derby della Madonnina - jornada 3',   CAST(2 AS SMALLINT), CAST(2 AS SMALLINT))) v(evento, ml, mv)
    JOIN dbo.Evento e ON e.descripcion = v.evento
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Resultado r WHERE r.id_evento = e.id_evento);

/* ==========================================================================
   6. APUESTAS SIMPLES (cuota congelada = cuota vigente al momento de apostar)
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Apuesta a
               JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
               WHERE u.correo LIKE N'%@apuestadb.co')
    INSERT INTO dbo.Apuesta (id_usuario, id_opcion, id_tipo_saldo, monto, cuota_congelada, tipo_apuesta, estado, fecha_hora_registro)
    SELECT u.id_usuario, o.id_opcion, ts.id_tipo_saldo, v.monto, o.cuota_vigente, 'simple', v.estado,
           CONVERT(DATETIME2(3), v.fecha)
    FROM (VALUES (N'andres.restrepo@apuestadb.co',   N'Clasico capitalino - fecha 3',      'local',     CAST(50000.00 AS DECIMAL(18,2)), '2026-07-11T10:15:00', 'ganada'),
                 (N'laura.cardenas@apuestadb.co',    N'Clasico capitalino - fecha 3',      'empate',    CAST(30000.00 AS DECIMAL(18,2)), '2026-07-11T18:40:00', 'perdida'),
                 (N'sebastian.gomez@apuestadb.co',   N'Fecha 4 - Liga BetPlay',            'empate',    CAST(20000.00 AS DECIMAL(18,2)), '2026-07-18T20:05:00', 'ganada'),
                 (N'valentina.torres@apuestadb.co',  N'Fecha 4 - Liga BetPlay',            'visitante', CAST(15000.00 AS DECIMAL(18,2)), '2026-07-19T09:30:00', 'perdida'),
                 (N'andres.restrepo@apuestadb.co',   N'Clasico paisa - fecha 5',           'visitante', CAST(40000.00 AS DECIMAL(18,2)), '2026-07-25T21:10:00', 'ganada'),
                 (N'camilo.uribe@apuestadb.co',      N'El Clasico - jornada 3',            'local',     CAST(60000.00 AS DECIMAL(18,2)), '2026-09-04T12:00:00', 'ganada'),
                 (N'camilo.uribe@apuestadb.co',      N'North West Derby - jornada 4',      'visitante', CAST(25000.00 AS DECIMAL(18,2)), '2026-09-06T08:45:00', 'ganada'),
                 (N'daniela.ospina@apuestadb.co',    N'Derby della Madonnina - jornada 3', 'empate',    CAST(10000.00 AS DECIMAL(18,2)), '2026-09-11T16:20:00', 'ganada'),
                 (N'sebastian.gomez@apuestadb.co',   N'Fecha 8 - Liga BetPlay',            'local',     CAST(30000.00 AS DECIMAL(18,2)), '2026-09-13T11:05:00', 'pendiente'),
                 (N'valentina.torres@apuestadb.co',  N'El Clasico de vuelta - jornada 8',  'visitante', CAST(35000.00 AS DECIMAL(18,2)), '2026-09-14T15:35:00', 'pendiente')) v(correo, evento, etiqueta, monto, fecha, estado)
    JOIN dbo.Usuario u ON u.correo = v.correo
    JOIN dbo.Evento e ON e.descripcion = v.evento
    JOIN dbo.Mercado m ON m.id_evento = e.id_evento AND m.nombre = N'Resultado final'
    JOIN dbo.OpcionApuesta o ON o.id_mercado = m.id_mercado AND o.etiqueta = v.etiqueta
    JOIN dbo.TipoSaldo ts ON ts.nombre = 'tokens'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Apuesta a
                      WHERE a.id_usuario = u.id_usuario AND a.id_opcion = o.id_opcion);

/* ==========================================================================
   7. LIQUIDACIONES (la opcion ganadora se deriva del marcador oficial)
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Liquidacion l
               JOIN dbo.Apuesta a ON a.id_apuesta = l.id_apuesta
               JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
               WHERE u.correo LIKE N'%@apuestadb.co')
    INSERT INTO dbo.Liquidacion (id_apuesta, id_resultado, resultado_liquidacion, monto_premio, fecha_hora, estado)
    SELECT a.id_apuesta, r.id_resultado,
           CASE WHEN o.etiqueta = x.opcion_ganadora THEN 'ganada' ELSE 'perdida' END,
           CASE WHEN o.etiqueta = x.opcion_ganadora
                THEN CAST(a.monto * a.cuota_congelada AS DECIMAL(18,2)) ELSE 0 END,
           DATEADD(HOUR, 3, e.fecha_hora_inicio), 'aplicada'
    FROM dbo.Apuesta a
    JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
    JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
    JOIN dbo.Mercado m ON m.id_mercado = o.id_mercado
    JOIN dbo.Evento e ON e.id_evento = m.id_evento
    JOIN dbo.Resultado r ON r.id_evento = e.id_evento AND r.estado = 'oficial'
    CROSS APPLY (SELECT CASE WHEN r.marcador_local > r.marcador_visitante THEN 'local'
                             WHEN r.marcador_local < r.marcador_visitante THEN 'visitante'
                             ELSE 'empate' END AS opcion_ganadora) x
    WHERE u.correo LIKE N'%@apuestadb.co'
      AND NOT EXISTS (SELECT 1 FROM dbo.Liquidacion l WHERE l.id_apuesta = a.id_apuesta);

UPDATE a
SET a.estado = l.resultado_liquidacion
FROM dbo.Apuesta a
JOIN dbo.Liquidacion l ON l.id_apuesta = a.id_apuesta
JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
WHERE u.correo LIKE N'%@apuestadb.co';

/* ==========================================================================
   8. SALDO FICTICIO: RECARGAS, MOVIMIENTOS Y SALDO CONSOLIDADO
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.Recarga WHERE observacion LIKE N'DEMO 12.1%')
BEGIN
    INSERT INTO dbo.Recarga (id_usuario, id_tipo_saldo, monto, fecha_hora, estado, observacion)
    SELECT u.id_usuario, ts.id_tipo_saldo, v.monto, CONVERT(DATETIME2(3), v.fecha), 'aplicada', v.observacion
    FROM (VALUES (N'andres.restrepo@apuestadb.co',   'tokens', CAST(200000.00 AS DECIMAL(18,2)), '2026-07-01T09:20:00', N'DEMO 12.1 - Recarga inicial de tokens'),
                 (N'laura.cardenas@apuestadb.co',    'tokens', CAST(100000.00 AS DECIMAL(18,2)), '2026-07-02T10:45:00', N'DEMO 12.1 - Recarga inicial de tokens'),
                 (N'sebastian.gomez@apuestadb.co',   'tokens', CAST(150000.00 AS DECIMAL(18,2)), '2026-07-05T16:10:00', N'DEMO 12.1 - Recarga inicial de tokens'),
                 (N'valentina.torres@apuestadb.co',  'tokens', CAST(120000.00 AS DECIMAL(18,2)), '2026-07-08T11:30:00', N'DEMO 12.1 - Recarga inicial de tokens'),
                 (N'camilo.uribe@apuestadb.co',      'tokens', CAST(250000.00 AS DECIMAL(18,2)), '2026-07-12T14:55:00', N'DEMO 12.1 - Recarga inicial de tokens'),
                 (N'daniela.ospina@apuestadb.co',    'tokens', CAST(80000.00 AS DECIMAL(18,2)),  '2026-07-15T19:35:00', N'DEMO 12.1 - Recarga inicial de tokens'),
                 (N'andres.restrepo@apuestadb.co',   'PSE',    CAST(50000.00 AS DECIMAL(18,2)),  '2026-08-02T09:00:00', N'DEMO 12.1 - Recarga por PSE'),
                 (N'laura.cardenas@apuestadb.co',    'PSE',    CAST(60000.00 AS DECIMAL(18,2)),  '2026-08-06T15:15:00', N'DEMO 12.1 - Recarga por PSE')) v(correo, tipo_saldo, monto, fecha, observacion)
    JOIN dbo.Usuario u ON u.correo = v.correo
    JOIN dbo.TipoSaldo ts ON ts.nombre = v.tipo_saldo;
END

/* Plan de movimientos coherente (debitos/creditos calculados en orden cronologico). */
DECLARE @mov TABLE
(
    id_saldo_cuenta INT           NOT NULL,
    mov             VARCHAR(20)   NOT NULL,
    id_apuesta      INT           NULL,
    id_recarga      INT           NULL,
    monto           DECIMAL(18,2) NOT NULL,
    fecha_hora      DATETIME2(3)  NOT NULL,
    referencia      NVARCHAR(100) NULL,
    orden           INT           NOT NULL
);

IF NOT EXISTS (SELECT 1 FROM dbo.MovimientoSaldo m
               JOIN dbo.SaldoCuenta sc ON sc.id_saldo_cuenta = m.id_saldo_cuenta
               JOIN dbo.Usuario u ON u.id_usuario = sc.id_usuario
               WHERE u.correo LIKE N'%@apuestadb.co')
BEGIN
    /* 8.1 Recargas */
    INSERT INTO @mov (id_saldo_cuenta, mov, id_recarga, monto, fecha_hora, referencia, orden)
    SELECT sc.id_saldo_cuenta, 'recarga', r.id_recarga, r.monto, r.fecha_hora,
           N'Recarga de saldo ficticio - DEMO 12.1', 1
    FROM dbo.Recarga r
    JOIN dbo.SaldoCuenta sc ON sc.id_usuario = r.id_usuario AND sc.id_tipo_saldo = r.id_tipo_saldo
    WHERE r.observacion LIKE N'DEMO 12.1%';

    /* 8.2 Debitos por apuesta */
    INSERT INTO @mov (id_saldo_cuenta, mov, id_apuesta, monto, fecha_hora, referencia, orden)
    SELECT sc.id_saldo_cuenta, 'apuesta', a.id_apuesta, a.monto, a.fecha_hora_registro,
           N'Descuento por registro de apuesta - DEMO 12.1', 2
    FROM dbo.Apuesta a
    JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
    JOIN dbo.SaldoCuenta sc ON sc.id_usuario = a.id_usuario AND sc.id_tipo_saldo = a.id_tipo_saldo
    WHERE u.correo LIKE N'%@apuestadb.co';

    /* 8.3 Creditos por premio */
    INSERT INTO @mov (id_saldo_cuenta, mov, id_apuesta, monto, fecha_hora, referencia, orden)
    SELECT sc.id_saldo_cuenta, 'premio', l.id_apuesta, l.monto_premio, l.fecha_hora,
           N'Premio por apuesta ganada - DEMO 12.1', 3
    FROM dbo.Liquidacion l
    JOIN dbo.Apuesta a ON a.id_apuesta = l.id_apuesta
    JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
    JOIN dbo.SaldoCuenta sc ON sc.id_usuario = a.id_usuario AND sc.id_tipo_saldo = a.id_tipo_saldo
    WHERE u.correo LIKE N'%@apuestadb.co' AND l.monto_premio > 0;

    /* 8.4 Insercion con saldo_resultante acumulado (particionado por cuenta) */
    INSERT INTO dbo.MovimientoSaldo (id_saldo_cuenta, id_tipo_movimiento, id_apuesta, id_recarga,
                                     monto, saldo_resultante, fecha_hora, referencia)
    SELECT m.id_saldo_cuenta, tm.id_tipo_movimiento, m.id_apuesta, m.id_recarga, m.monto,
           SUM(CASE WHEN tm.naturaleza = 'debito' THEN -m.monto ELSE m.monto END)
               OVER (PARTITION BY m.id_saldo_cuenta ORDER BY m.fecha_hora, m.orden
                     ROWS UNBOUNDED PRECEDING),
           m.fecha_hora, m.referencia
    FROM @mov m
    JOIN dbo.TipoMovimientoSaldo tm ON tm.nombre = m.mov
    ORDER BY m.id_saldo_cuenta, m.fecha_hora, m.orden;

    /* 8.5 Saldo consolidado = suma del plan (coherente con el ultimo movimiento) */
    UPDATE sc
    SET sc.saldo_actual = x.saldo_final,
        sc.fecha_ultima_actualizacion = SYSDATETIME()
    FROM dbo.SaldoCuenta sc
    JOIN (SELECT id_saldo_cuenta,
                 SUM(CASE WHEN mov = 'apuesta' THEN -monto ELSE monto END) AS saldo_final
          FROM @mov GROUP BY id_saldo_cuenta) x
      ON x.id_saldo_cuenta = sc.id_saldo_cuenta;
END

/* ==========================================================================
   9. PREFERENCIAS, NOTIFICACIONES Y AUDITORIA
   ========================================================================== */
IF NOT EXISTS (SELECT 1 FROM dbo.FavoritoEquipo f
               JOIN dbo.Usuario u ON u.id_usuario = f.id_usuario
               WHERE u.correo LIKE N'%@apuestadb.co')
    INSERT INTO dbo.FavoritoEquipo (id_usuario, id_equipo, fecha_marcado)
    SELECT u.id_usuario, e.id_equipo, CONVERT(DATETIME2(3), v.fecha)
    FROM (VALUES (N'andres.restrepo@apuestadb.co',  N'Atletico Nacional',      '2026-07-01T09:30:00'),
                 (N'andres.restrepo@apuestadb.co',  N'Real Madrid',            '2026-07-01T09:31:00'),
                 (N'laura.cardenas@apuestadb.co',   N'Millonarios',             '2026-07-02T10:50:00'),
                 (N'sebastian.gomez@apuestadb.co',  N'America de Cali',         '2026-07-05T16:20:00'),
                 (N'valentina.torres@apuestadb.co', N'Junior de Barranquilla',  '2026-07-08T11:40:00'),
                 (N'camilo.uribe@apuestadb.co',     N'FC Barcelona',            '2026-07-12T15:00:00'),
                 (N'daniela.ospina@apuestadb.co',   N'Los Angeles Lakers',      '2026-07-15T19:40:00')) v(correo, equipo, fecha)
    JOIN dbo.Usuario u ON u.correo = v.correo
    JOIN dbo.Equipo e ON e.nombre = v.equipo
    WHERE NOT EXISTS (SELECT 1 FROM dbo.FavoritoEquipo f
                      WHERE f.id_usuario = u.id_usuario AND f.id_equipo = e.id_equipo);

IF NOT EXISTS (SELECT 1 FROM dbo.Notificacion n
               JOIN dbo.Usuario u ON u.id_usuario = n.id_usuario
               WHERE u.correo LIKE N'%@apuestadb.co')
    INSERT INTO dbo.Notificacion (id_usuario, mensaje, tipo, fecha_hora, estado)
    SELECT u.id_usuario, v.mensaje, v.tipo, CONVERT(DATETIME2(3), v.fecha), v.estado
    FROM (VALUES (N'andres.restrepo@apuestadb.co',  N'Bienvenido a ApuestaDB. Tu cuenta fue creada con saldos en cero.', N'bienvenida', '2026-07-01T09:16:00', 'leida'),
                 (N'andres.restrepo@apuestadb.co',  N'Se acredito una recarga de saldo ficticio por 200000 tokens.', N'recarga', '2026-07-01T09:20:30', 'leida'),
                 (N'andres.restrepo@apuestadb.co',  N'Tu apuesta por Atletico Nacional fue registrada (cuota 1.85).', N'apuesta', '2026-07-11T10:15:20', 'leida'),
                 (N'andres.restrepo@apuestadb.co',  N'Tu apuesta fue liquidada: ganada. Premio acreditado: 92500 tokens.', N'liquidacion', '2026-07-12T22:30:00', 'leida'),
                 (N'laura.cardenas@apuestadb.co',   N'Bienvenida a ApuestaDB. Tu cuenta fue creada con saldos en cero.', N'bienvenida', '2026-07-02T10:41:00', 'leida'),
                 (N'laura.cardenas@apuestadb.co',   N'Tu apuesta por el empate fue liquidada: perdida.', N'liquidacion', '2026-07-12T22:30:00', 'no_leida'),
                 (N'sebastian.gomez@apuestadb.co',  N'Bienvenido a ApuestaDB. Tu cuenta fue creada con saldos en cero.', N'bienvenida', '2026-07-05T16:06:00', 'leida'),
                 (N'sebastian.gomez@apuestadb.co',  N'Tu apuesta fue liquidada: ganada. Premio acreditado: 62000 tokens.', N'liquidacion', '2026-07-19T21:15:00', 'no_leida'),
                 (N'valentina.torres@apuestadb.co', N'Bienvenida a ApuestaDB. Tu cuenta fue creada con saldos en cero.', N'bienvenida', '2026-07-08T11:26:00', 'leida'),
                 (N'camilo.uribe@apuestadb.co',     N'Tu apuesta fue liquidada: ganada. Premio acreditado: 117000 tokens.', N'liquidacion', '2026-09-06T00:00:00', 'no_leida'),
                 (N'daniela.ospina@apuestadb.co',   N'Se acredito una recarga de saldo ficticio por 80000 tokens.', N'recarga', '2026-07-15T19:36:00', 'leida'),
                 (N'daniela.ospina@apuestadb.co',   N'Tu apuesta fue liquidada: ganada. Premio acreditado: 31000 tokens.', N'liquidacion', '2026-09-12T23:50:00', 'no_leida')) v(correo, mensaje, tipo, fecha, estado)
    JOIN dbo.Usuario u ON u.correo = v.correo;

IF NOT EXISTS (SELECT 1 FROM dbo.Auditoria WHERE descripcion LIKE N'DEMO 12.1%')
    INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
    SELECT u.id_usuario, v.operacion, v.entidad, N'DEMO 12.1 - ' + v.descripcion,
           CONVERT(DATETIME2(3), v.fecha), v.resultado, v.origen
    FROM (VALUES (N'andres.restrepo@apuestadb.co',  N'Registrar usuario',      N'Usuario',        N'Alta de usuario con saldos iniciales en cero.', '2026-07-01T09:15:05', 'exito', '192.168.1.10'),
                 (N'andres.restrepo@apuestadb.co',  N'Crear recarga',          N'Recarga',        N'Recarga de 200000 tokens aplicada.', '2026-07-01T09:20:00', 'exito', '192.168.1.10'),
                 (N'sebastian.gomez@apuestadb.co',  N'Registrar apuesta',      N'Apuesta',        N'Apuesta simple registrada con cuota congelada 3.10.', '2026-07-18T20:05:00', 'exito', '192.168.1.22'),
                 (N'andres.restrepo@apuestadb.co',  N'Consultar saldo',        N'SaldoCuenta',    N'Consulta de saldo por tokens y PSE.', '2026-07-20T08:00:00', 'exito', '192.168.1.10'),
                 (N'valentina.torres@apuestadb.co', N'Iniciar sesion',         N'Usuario',        N'Acceso correcto con credencial valida.', '2026-07-19T09:25:00', 'exito', '192.168.1.35'),
                 (NULL,                             N'Iniciar sesion',         N'Usuario',        N'Credenciales invalidas (correo no registrado).', '2026-08-01T22:10:00', 'fallo', '190.25.14.77'),
                 (NULL,                             N'Actualizar cuota',       N'OpcionApuesta',  N'Ajuste de cuota previo a la apertura del mercado.', '2026-09-03T11:00:00', 'exito', NULL),
                 (N'camilo.uribe@apuestadb.co',     N'Liquidar apuesta',       N'Liquidacion',    N'Proceso de liquidacion ejecutado sobre evento finalizado.', '2026-09-06T00:05:00', 'exito', '192.168.1.48')) v(correo, operacion, entidad, descripcion, fecha, resultado, origen)
    LEFT JOIN dbo.Usuario u ON u.correo = v.correo;

PRINT N'06_demo_data.sql: datos de demostracion cargados.';
GO

/* ==========================================================================
   10. VERIFICACION (conteo por tabla)
   ========================================================================== */
SELECT t.name AS tabla, SUM(p.rows) AS filas
FROM sys.tables t
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
GROUP BY t.name
ORDER BY t.name;
GO
