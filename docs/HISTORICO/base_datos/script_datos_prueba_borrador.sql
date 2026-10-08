/* ============================================================================
   APUESTADB - Datos de prueba (BORRADOR)
   ----------------------------------------------------------------------------
   Motor       : SQL Server (T-SQL)
   Fecha       : 24/ago/2026
   Requiere    : ejecutar primero script_tablas_sqlserver_borrador.sql
   Estado      : BORRADOR - datos ficticios para probar el modelo completo.
   ----------------------------------------------------------------------------
   HISTORIA QUE SIMULA (ciclo completo del cliente):
     1. Shantal se registra como cliente (rol 'usuario').
     2. Recibe recargas: 50.000 en TOKENS y 20.000 en PSE (regla R5).
     3. Ve el partido Nacional vs Medellin y la cuota de 'local' = 1.85.
     4. Apuesta 10.000 al local PAGANDO CON TOKENS (regla R2).
        -> se descuenta de su saldo de tokens: 50.000 - 10.000 = 40.000.
     5. El partido termina 2-1 (local gana). Se registra el Resultado.
     6. La apuesta se liquida como GANADA; premio = 10.000 x 1.85 = 18.500.
        -> se abona al MISMO tipo (tokens, regla R3): 40.000 + 18.500 = 58.500.
   ============================================================================ */

USE ApuestaDB;
GO

-- ============================================================================
-- CATALOGOS BASICOS
-- ============================================================================

-- Tipos de saldo (regla R1): tokens y PSE, ambos ficticios
INSERT INTO TipoSaldo (nombre, descripcion) VALUES
    ('tokens', 'Moneda virtual del juego (ficticia)'),
    ('pse',    'Saldo recargado via PSE simulado (ficticio)');

-- Empresa operadora (tabla #1)
INSERT INTO Empresa (nombre, nit, telefono, correo) VALUES
    ('ApuestaDB S.A.S.', '900123456-7', '3001234567', 'contacto@apuestadb.com');

-- Roles (apoyo de Usuario --> ROL)
INSERT INTO Rol (nombre, descripcion) VALUES
    ('admin',   'Administra eventos, cuotas y resultados'),
    ('usuario', 'Cliente que apuesta');

-- Servicios (SUPUESTO - validar con el profesor que contiene)
INSERT INTO Servicios (nombre, descripcion) VALUES
    ('recarga_saldo', 'Recarga de saldo ficticio (tokens o PSE)'),
    ('retiro_saldo',  'Retiro simulado de saldo');

-- Reglas (SUPUESTO - validar con el profesor; ejemplo de parametro configurable)
INSERT INTO Reglas (nombre, descripcion, parametro) VALUES
    ('monto_minimo_apuesta', 'Valor minimo permitido por apuesta', '1000');

-- Deportes (por ahora solo futbol)
INSERT INTO Deportes (nombre) VALUES ('futbol');

-- ============================================================================
-- USUARIOS (tabla #2 / Cliente)
--   La contrasena es un HASH FICTICIO de ejemplo; el hash real lo genera el
--   backend. Nunca se guarda la contrasena en texto plano (regla #12).
-- ============================================================================
INSERT INTO Usuario (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                     rol_id, tipo_documento, numero_documento, celular, correo,
                     contrasena_hash, estado)
VALUES
    ('Jhon', 'Bayron', 'Pelaez', 'Guerra',
     1, 'CC', '1234567890', '3001234567', 'jhon@apuestadb.com',
     'HASH_FICTICIO_$2b$12$ejemploNoRealParaPruebas', 'activo'),
    ('Shantal', NULL, 'Coneo', 'Garcia',
     2, 'CC', '9876543210', '3007654321', 'shantal@apuestadb.com',
     'HASH_FICTICIO_$2b$12$ejemploNoRealParaPruebas', 'activo');
-- ids generados: Jhon = 1 (admin), Shantal = 2 (cliente)

-- Login: registro de un inicio de sesion exitoso de Shantal
INSERT INTO Login (usuario_id, ip, exitoso) VALUES (2, '192.168.1.10', 1);

-- ============================================================================
-- SALDO O CUENTA (tabla #14) - por tipo (reglas R1 y R5)
--   Shantal: 50.000 en tokens y 20.000 en PSE
-- ============================================================================
INSERT INTO SaldoCuenta (usuario_id, tipo_saldo_id, saldo) VALUES
    (2, 1, 50000.00),   -- tokens
    (2, 2, 20000.00);   -- pse

-- ============================================================================
-- DOMINIO DEPORTIVO
-- ============================================================================

-- Liga
INSERT INTO Liga (nombre, deporte_id, pais) VALUES
    ('Liga BetPlay', 1, 'Colombia');

-- Equipos (ids: 1 Nacional, 2 Medellin, 3 Millonarios, 4 America)
INSERT INTO Equipo (nombre, liga_id) VALUES
    ('Atletico Nacional', 1),
    ('Deportivo Medellin', 1),
    ('Millonarios', 1),
    ('America de Cali', 1);

-- Calendario (tabla #10)
--   Partido 1: FINALIZADO (para demostrar liquidacion)
--   Partido 2: programado (para demostrar oferta activa)
INSERT INTO Calendario (liga_id, equipo_local_id, equipo_visitante_id, fecha_hora, estado)
VALUES
    (1, 1, 2, '2026-09-01 19:30:00', 'finalizado'),
    (1, 3, 4, '2026-09-08 18:00:00', 'programado');

-- ============================================================================
-- APUESTAS = OFERTA (tabla #8 - SUPUESTO: validar con el profesor)
--   Partido 1 (finalizado): cuotas cerradas
--   Partido 2 (programado): cuotas activas
-- ============================================================================
INSERT INTO Apuestas (calendario_id, mercado, opcion, cuota, estado)
VALUES
    (1, 'resultado del partido', 'local',     1.85, 'cerrada'),
    (1, 'resultado del partido', 'empate',    3.20, 'cerrada'),
    (1, 'resultado del partido', 'visitante', 4.50, 'cerrada'),
    (2, 'resultado del partido', 'local',     2.10, 'activa'),
    (2, 'resultado del partido', 'empate',    3.00, 'activa'),
    (2, 'resultado del partido', 'visitante', 3.40, 'activa');
-- ids generados: 1=local P1, 2=empate P1, 3=visitante P1, 4=local P2, 5=empate P2, 6=visitante P2

-- ============================================================================
-- HACER APUESTA (tabla #11) - la apuesta de Shantal
--   Se hizo cuando el partido estaba PROGRAMADO (regla #3).
--   Pago con TOKENS (tipo_saldo_id = 1, regla R2). Cuota aceptada copiada (reglas #4 y #5).
-- ============================================================================
INSERT INTO HacerApuesta (usuario_id, apuesta_id, tipo_saldo_id, monto, cuota_aceptada, estado, fecha)
VALUES (2, 1, 1, 10000.00, 1.85, 'ganada', '2026-08-30 10:00:00');

-- ============================================================================
-- LOG DE PAGO (tabla #13) - trazabilidad completa (reglas #10 y #11)
--   Cada movimiento indica el tipo de saldo afectado (tokens = 1, pse = 2).
-- ============================================================================
INSERT INTO LogPago (usuario_id, tipo_saldo_id, tipo, monto, saldo_resultante, hacer_apuesta_id, fecha)
VALUES
    (2, 1, 'recarga',  50000.00, 50000.00, NULL, '2026-08-28 09:00:00'),  -- recarga inicial tokens
    (2, 2, 'recarga',  20000.00, 20000.00, NULL, '2026-08-28 09:05:00'),  -- recarga pse
    (2, 1, 'apuesta', -10000.00, 40000.00, 1,    '2026-08-30 10:00:00'),  -- debito por la apuesta
    (2, 1, 'premio',   18500.00, 58500.00, 1,    '2026-09-01 21:30:00');  -- premio al mismo tipo (R3)

-- ============================================================================
-- RESULTADO (propuesta para la tabla #12 - SUPUESTO: validar con el profesor)
--   Partido 1 termino 2-1, gano el local. Un solo resultado por partido.
-- ============================================================================
INSERT INTO Resultado (calendario_id, marcador_local, marcador_visitante, ganador)
VALUES (1, 2, 1, 'local');

-- ============================================================================
-- CONSULTA DE VERIFICACION: saldo final de Shantal por tipo
--   Esperado: tokens = 58.500,00 | pse = 20.000,00
-- ============================================================================
SELECT u.primer_nombre + ' ' + u.primer_apellido AS cliente,
       ts.nombre                                AS tipo_saldo,
       sc.saldo
FROM SaldoCuenta sc
JOIN Usuario   u  ON u.id = sc.usuario_id
JOIN TipoSaldo ts ON ts.id = sc.tipo_saldo_id
WHERE sc.usuario_id = 2;
GO
