/* ============================================================================
   APUESTADB - Script de tablas (BORRADOR)
   ----------------------------------------------------------------------------
   Motor       : SQL Server (T-SQL)
   Fecha       : 24/ago/2026
   Elaborado   : ApuestaDB (asistente académico), basado en material de clase
                 trabajado junto al profesor (listado de tablas + atributos de
                 Cliente) y en la indicacion de saldo por tipos (tokens/PSE).
   Estado      : BORRADOR - pendiente de validacion con el profesor.
                 No es modelo definitivo ni esta aprobado.
   ----------------------------------------------------------------------------
   SUPOSICIONES (marcadas en el script con -- SUPUESTO):
     1. "Usuario --> ROL" se modela con una tabla Rol (evita repetir el nombre).
     2. "Servicios" y "Reglas" no se definieron en clase: se modelan como
        catalogos genericos; hay que preguntar al profesor su contenido real.
     3. "Apuestas" se interpreta como la OFERTA disponible (mercado + opcion
        + cuota); "Hacer apuesta" es la apuesta concreta del cliente.
     4. La tabla #12 quedo vacia en clase: se propone "Resultado" para
        permitir la liquidacion de apuestas (regla de negocio #15).
     5. Se agrega correo en Usuario como medio de login (falta confirmar).
     6. La contrasena se guarda como HASH, nunca texto plano (regla #12).

   REGLAS CONFIRMADAS (24/ago/2026 - indicacion del profesor, aplicada por Jhon):
     R1. El saldo del usuario se divide por TIPO: tokens y PSE (ficticios).
     R2. Una apuesta se paga con UN SOLO tipo de saldo (tokens o PSE).
     R3. El premio se abona al MISMO tipo de saldo con que se pago la apuesta.
     R4. NO hay conversion entre tokens y PSE (cada tipo es independiente).
     R5. Se puede recargar saldo de AMBOS tipos (tokens y PSE simulados).
   ============================================================================ */

-- Base de datos (omitir estas 2 lineas si ApuestaDB ya existe)
CREATE DATABASE ApuestaDB;
GO
USE ApuestaDB;
GO

-- ============================================================================
-- 1. EMPRESA (tabla #1 del listado) - operador de la plataforma
-- ============================================================================
CREATE TABLE Empresa (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(150) NOT NULL,
    nit         VARCHAR(20)    NOT NULL UNIQUE,
    telefono    VARCHAR(20)    NULL,
    correo      NVARCHAR(150)  NULL,
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 2. ROL (apoyo de la tabla #2 "Usuario --> ROL") - SUPUESTO 1
-- ============================================================================
CREATE TABLE Rol (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(30)    NOT NULL UNIQUE,
    descripcion NVARCHAR(200)  NULL
);

-- ============================================================================
-- 3. SERVICIOS (tabla #4 del listado) - SUPUESTO 2: catalogo generico
--    Preguntar al profesor que contiene realmente.
-- ============================================================================
CREATE TABLE Servicios (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100)  NOT NULL UNIQUE,
    descripcion NVARCHAR(255)  NULL,
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 4. REGLAS (tabla #6 del listado) - SUPUESTO 2: catalogo generico
--    Las reglas de negocio suelen ser restricciones del sistema, no datos.
--    Confirmar con el profesor si realmente las quiere como tabla.
-- ============================================================================
CREATE TABLE Reglas (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100)  NOT NULL,
    descripcion NVARCHAR(500)  NULL,
    parametro   NVARCHAR(100)  NULL,   -- valor configurable (ej. monto minimo)
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 5. DEPORTES (tabla #5 del listado)
-- ============================================================================
CREATE TABLE Deportes (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(50)    NOT NULL UNIQUE,
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 6. USUARIO / CLIENTE (tabla #2 del listado)
--    Atributos dados en clase: primer nombre, segundo nombre, primer apellido,
--    segundo apellido, rol, tipo doc, #doc, cel, fecha registro, contrasena,
--    estado. Se agrega correo (SUPUESTO 5) y saldo vive en SaldoCuenta.
-- ============================================================================
CREATE TABLE Usuario (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    primer_nombre     NVARCHAR(60)   NOT NULL,
    segundo_nombre    NVARCHAR(60)   NULL,
    primer_apellido   NVARCHAR(60)   NOT NULL,
    segundo_apellido  NVARCHAR(60)   NULL,
    rol_id            INT            NOT NULL
        CONSTRAINT FK_Usuario_Rol REFERENCES Rol(id),
    tipo_documento    VARCHAR(10)    NOT NULL
        CHECK (tipo_documento IN ('CC', 'CE', 'TI', 'PAS')),
    numero_documento  VARCHAR(20)    NOT NULL UNIQUE,
    celular           VARCHAR(15)    NOT NULL,
    correo            NVARCHAR(150)  NULL UNIQUE,   -- SUPUESTO 5
    fecha_registro    DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    contrasena_hash   NVARCHAR(255)  NOT NULL,      -- SUPUESTO 6: hash, no texto plano
    estado            VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 7. LOGIN (tabla #3 del listado) - registro de inicios de sesion
-- ============================================================================
CREATE TABLE Login (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id  INT            NOT NULL
        CONSTRAINT FK_Login_Usuario REFERENCES Usuario(id),
    fecha       DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    ip          VARCHAR(45)    NULL,   -- soporta IPv6
    exitoso     BIT            NOT NULL DEFAULT 1
);

-- ============================================================================
-- 8. TIPO DE SALDO (nueva, indicacion del profesor 24/ago/2026 - regla R1)
--    El saldo se divide en tipos: tokens y PSE (ambos ficticios).
-- ============================================================================
CREATE TABLE TipoSaldo (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(30)    NOT NULL UNIQUE,  -- 'tokens', 'pse'
    descripcion NVARCHAR(200)  NULL,
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 9. SALDO O CUENTA (tabla #14 del listado) - cuenta del usuario POR TIPO
--    Un usuario puede tener saldo en tokens Y en PSE (reglas R1 y R5).
-- ============================================================================
CREATE TABLE SaldoCuenta (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id          INT            NOT NULL
        CONSTRAINT FK_SaldoCuenta_Usuario REFERENCES Usuario(id),
    tipo_saldo_id       INT            NOT NULL
        CONSTRAINT FK_SaldoCuenta_TipoSaldo REFERENCES TipoSaldo(id),
    saldo               DECIMAL(12,2)  NOT NULL DEFAULT 0
        CHECK (saldo >= 0),            -- el saldo no puede ser negativo
    estado              VARCHAR(20)    NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'congelada')),
    fecha_actualizacion DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_SaldoCuenta_UsuarioTipo UNIQUE (usuario_id, tipo_saldo_id)
);

-- ============================================================================
-- 9. LIGA (tabla #7 del listado)
-- ============================================================================
CREATE TABLE Liga (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100)  NOT NULL,
    deporte_id  INT            NOT NULL
        CONSTRAINT FK_Liga_Deportes REFERENCES Deportes(id),
    pais        NVARCHAR(60)   NULL,
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 10. EQUIPO (tabla #9 del listado)
-- ============================================================================
CREATE TABLE Equipo (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100)  NOT NULL,
    liga_id     INT            NOT NULL
        CONSTRAINT FK_Equipo_Liga REFERENCES Liga(id),
    estado      VARCHAR(20)    NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo'))
);

-- ============================================================================
-- 11. CALENDARIO (tabla #10 del listado) - los partidos/eventos
--     Un equipo no puede jugar contra si mismo (regla de negocio #8).
-- ============================================================================
CREATE TABLE Calendario (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    liga_id               INT            NOT NULL
        CONSTRAINT FK_Calendario_Liga REFERENCES Liga(id),
    equipo_local_id       INT            NOT NULL
        CONSTRAINT FK_Calendario_EquipoLocal REFERENCES Equipo(id),
    equipo_visitante_id   INT            NOT NULL
        CONSTRAINT FK_Calendario_EquipoVisitante REFERENCES Equipo(id),
    fecha_hora            DATETIME2      NOT NULL,
    estado                VARCHAR(20)    NOT NULL DEFAULT 'programado'
        CHECK (estado IN ('programado', 'en_curso', 'finalizado', 'cancelado')),
    CONSTRAINT CK_Calendario_EquiposDiferentes
        CHECK (equipo_local_id <> equipo_visitante_id)
);

-- ============================================================================
-- 12. APUESTAS (tabla #8 del listado) - SUPUESTO 3: la OFERTA disponible
--     (mercado + opcion + cuota). Un partido ofrece: local/empate/visitante.
-- ============================================================================
CREATE TABLE Apuestas (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    calendario_id INT            NOT NULL
        CONSTRAINT FK_Apuestas_Calendario REFERENCES Calendario(id),
    mercado       VARCHAR(60)    NOT NULL DEFAULT 'resultado del partido',
    opcion        VARCHAR(10)    NOT NULL
        CHECK (opcion IN ('local', 'empate', 'visitante')),
    cuota         DECIMAL(6,2)   NOT NULL
        CHECK (cuota > 1),
    estado        VARCHAR(20)    NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'suspendida', 'cerrada')),
    CONSTRAINT UQ_Apuestas_CalendarioOpcion UNIQUE (calendario_id, opcion)
);

-- ============================================================================
-- 13. HACER APUESTA (tabla #11 del listado) - la apuesta concreta del cliente
--     Guarda la cuota aceptada (reglas #4 y #5): si la cuota cambia despues,
--     la apuesta no se altera. Guarda el tipo de saldo con que se pago (R2)
--     para abonar el premio al mismo tipo (R3).
-- ============================================================================
CREATE TABLE HacerApuesta (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id      INT            NOT NULL
        CONSTRAINT FK_HacerApuesta_Usuario REFERENCES Usuario(id),
    apuesta_id      INT            NOT NULL   -- oferta elegida (tabla Apuestas)
        CONSTRAINT FK_HacerApuesta_Apuestas REFERENCES Apuestas(id),
    tipo_saldo_id   INT            NOT NULL   -- saldo usado (tokens o pse); R2
        CONSTRAINT FK_HacerApuesta_TipoSaldo REFERENCES TipoSaldo(id),
    monto           DECIMAL(12,2)  NOT NULL
        CHECK (monto > 0),                    -- regla #1
    cuota_aceptada  DECIMAL(6,2)   NOT NULL
        CHECK (cuota_aceptada > 1),
    estado          VARCHAR(20)    NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'ganada', 'perdida', 'anulada')),
    fecha           DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- ============================================================================
-- 14. LOG DE PAGO (tabla #13 del listado) - movimientos de saldo ficticio
--     Toda modificacion del saldo genera un movimiento (reglas #10 y #11).
-- ============================================================================
CREATE TABLE LogPago (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id        INT            NOT NULL
        CONSTRAINT FK_LogPago_Usuario REFERENCES Usuario(id),
    tipo_saldo_id     INT            NOT NULL   -- saldo afectado (tokens o pse)
        CONSTRAINT FK_LogPago_TipoSaldo REFERENCES TipoSaldo(id),
    tipo              VARCHAR(20)    NOT NULL
        CHECK (tipo IN ('apuesta', 'premio', 'ajuste', 'recarga')),
    monto             DECIMAL(12,2)  NOT NULL,  -- positivo = abono, negativo = debito
    saldo_resultante  DECIMAL(12,2)  NOT NULL,
    hacer_apuesta_id  INT            NULL
        CONSTRAINT FK_LogPago_HacerApuesta REFERENCES HacerApuesta(id),
    fecha             DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- ============================================================================
-- 15. RESULTADO (propuesta para la tabla #12 que quedo vacia) - SUPUESTO 4
--     Resultado oficial del partido; base de la liquidacion (regla #15).
--     Un solo resultado por partido.
-- ============================================================================
CREATE TABLE Resultado (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    calendario_id       INT            NOT NULL UNIQUE
        CONSTRAINT FK_Resultado_Calendario REFERENCES Calendario(id),
    marcador_local      TINYINT        NOT NULL DEFAULT 0,
    marcador_visitante  TINYINT        NOT NULL DEFAULT 0,
    ganador             VARCHAR(10)    NOT NULL
        CHECK (ganador IN ('local', 'empate', 'visitante')),
    fecha_registro      DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- ============================================================================
-- INDICES basicos sobre claves foraneas muy consultadas (Fase 5 completa esto)
-- ============================================================================
CREATE INDEX IX_Login_Usuario        ON Login(usuario_id);
CREATE INDEX IX_LogPago_Usuario      ON LogPago(usuario_id);
CREATE INDEX IX_HacerApuesta_Usuario ON HacerApuesta(usuario_id);
CREATE INDEX IX_Apuestas_Calendario  ON Apuestas(calendario_id);
CREATE INDEX IX_Calendario_Liga      ON Calendario(liga_id);
CREATE INDEX IX_SaldoCuenta_TipoSaldo  ON SaldoCuenta(tipo_saldo_id);
CREATE INDEX IX_LogPago_TipoSaldo      ON LogPago(tipo_saldo_id);
CREATE INDEX IX_HacerApuesta_TipoSaldo ON HacerApuesta(tipo_saldo_id);

/* ============================================================================
   NOTAS FINALES
   - Script BORRADOR (16 tablas): pendiente de validar con el profesor
     (Servicios, Reglas, Apuestas como oferta, Resultado, correo en Usuario).
   - Incluye el manejo de saldo por tipos tokens/PSE (reglas R1-R5, indicacion
     del profesor del 24/ago/2026 aplicada por Jhon).
   - No incluye datos de prueba (DML) ni la tabla Alineacion (se pidio
     despues; se agregaria en una siguiente version si el profesor la valida).
   - Si el profesor pide otro nombre o estructura, se ajusta este archivo.
   ============================================================================ */
