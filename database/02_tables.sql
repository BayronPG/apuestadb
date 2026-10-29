/* ============================================================================
   APUESTADB - 02_tables.sql
   Objetivo : Crear las 29 tablas (columnas, tipos, nulabilidad, IDENTITY).
   Las PK, UNIQUE, CHECK, DEFAULT y FK se agregan en 03_constraints.sql.
   Orden    : respeta las dependencias; todas las tablas se crean antes de las FK.
   ----------------------------------------------------------------------------
   OPCIONAL (re-ejecucion): descomente el bloque siguiente para eliminar las
   tablas existentes antes de recrearlas.  ADVERTENCIA: borra los datos.

   DROP TABLE IF EXISTS dbo.Auditoria, dbo.Notificacion, dbo.Liquidacion,
       dbo.Resultado, dbo.Recarga, dbo.MovimientoSaldo, dbo.TipoMovimientoSaldo,
       dbo.SaldoCuenta, dbo.TipoSaldo, dbo.FavoritoEquipo, dbo.Apuesta,
       dbo.HistorialCuota, dbo.OpcionApuesta, dbo.Mercado, dbo.CalendarioArbitro,
       dbo.Evento, dbo.Arbitro, dbo.Equipo, dbo.Temporada, dbo.Liga, dbo.Deporte,
       dbo.Estadio, dbo.Ciudad, dbo.Pais, dbo.TokenRecuperacion,
       dbo.RespuestaSeguridad, dbo.PreguntaSeguridad, dbo.Usuario, dbo.Rol;
   GO
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ======================= DOMINIO 1 - SEGURIDAD Y USUARIOS =================== */

CREATE TABLE dbo.Rol
(
    id_rol      INT            IDENTITY(1,1) NOT NULL,
    nombre      VARCHAR(20)    NOT NULL,
    descripcion NVARCHAR(255)  NULL,
    estado      VARCHAR(20)    NOT NULL
);
GO

CREATE TABLE dbo.Usuario
(
    id_usuario     INT           IDENTITY(1,1) NOT NULL,
    id_rol         INT           NOT NULL,
    nombres        NVARCHAR(100) NOT NULL,
    apellidos      NVARCHAR(100) NOT NULL,
    correo         NVARCHAR(150) NOT NULL,
    contrasena     VARCHAR(255)  NOT NULL,
    telefono       NVARCHAR(20)  NULL,
    estado         VARCHAR(20)   NOT NULL,
    fecha_registro DATETIME2(3)  NOT NULL
);
GO

CREATE TABLE dbo.PreguntaSeguridad
(
    id_pregunta INT           IDENTITY(1,1) NOT NULL,
    enunciado   NVARCHAR(255) NOT NULL,
    estado      VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.RespuestaSeguridad
(
    id_respuesta   INT          IDENTITY(1,1) NOT NULL,
    id_usuario     INT          NOT NULL,
    id_pregunta    INT          NOT NULL,
    respuesta      VARCHAR(255) NOT NULL,
    fecha_registro DATETIME2(3) NOT NULL
);
GO

CREATE TABLE dbo.TokenRecuperacion
(
    id_token         INT          IDENTITY(1,1) NOT NULL,
    id_usuario       INT          NOT NULL,
    valor_token      VARCHAR(128) NOT NULL,
    fecha_emision    DATETIME2(3) NOT NULL,
    fecha_expiracion DATETIME2(3) NOT NULL,
    estado           VARCHAR(20)  NOT NULL
);
GO

/* ========================= DOMINIO 2 - CATALOGO DEPORTIVO =================== */

CREATE TABLE dbo.Pais
(
    id_pais INT           IDENTITY(1,1) NOT NULL,
    nombre  NVARCHAR(100) NOT NULL,
    codigo  VARCHAR(10)   NULL
);
GO

CREATE TABLE dbo.Ciudad
(
    id_ciudad INT           IDENTITY(1,1) NOT NULL,
    id_pais   INT           NOT NULL,
    nombre    NVARCHAR(100) NOT NULL,
    region    NVARCHAR(100) NULL
);
GO

CREATE TABLE dbo.Estadio
(
    id_estadio INT           IDENTITY(1,1) NOT NULL,
    id_ciudad  INT           NOT NULL,
    nombre     NVARCHAR(100) NOT NULL,
    capacidad  INT           NULL,
    direccion  NVARCHAR(200) NULL
);
GO

CREATE TABLE dbo.Deporte
(
    id_deporte  INT           IDENTITY(1,1) NOT NULL,
    nombre      NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    estado      VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.Liga
(
    id_liga    INT           IDENTITY(1,1) NOT NULL,
    id_deporte INT           NOT NULL,
    nombre     NVARCHAR(100) NOT NULL,
    categoria  NVARCHAR(50)  NULL,
    estado     VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.Temporada
(
    id_temporada INT          IDENTITY(1,1) NOT NULL,
    id_liga      INT          NOT NULL,
    etiqueta     NVARCHAR(20) NOT NULL,
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NOT NULL,
    estado       VARCHAR(20)  NOT NULL
);
GO

CREATE TABLE dbo.Equipo
(
    id_equipo       INT           IDENTITY(1,1) NOT NULL,
    id_deporte      INT           NOT NULL,
    id_ciudad       INT           NOT NULL,
    nombre          NVARCHAR(100) NOT NULL,
    siglas          NVARCHAR(10)  NULL,
    fecha_fundacion DATE          NULL,
    estado          VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.Arbitro
(
    id_arbitro INT           IDENTITY(1,1) NOT NULL,
    nombres    NVARCHAR(100) NOT NULL,
    apellidos  NVARCHAR(100) NOT NULL,
    categoria  NVARCHAR(50)  NULL,
    estado     VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.Evento
(
    id_evento           INT           IDENTITY(1,1) NOT NULL,
    id_temporada        INT           NOT NULL,
    id_equipo_local     INT           NOT NULL,
    id_equipo_visitante INT           NOT NULL,
    id_estadio          INT           NOT NULL,
    fecha_hora_inicio   DATETIME2(3)  NOT NULL,
    estado              VARCHAR(20)   NOT NULL,
    descripcion         NVARCHAR(255) NULL
);
GO

CREATE TABLE dbo.CalendarioArbitro
(
    id_calendario     INT          IDENTITY(1,1) NOT NULL,
    id_evento         INT          NOT NULL,
    id_arbitro        INT          NOT NULL,
    rol_arbitro       VARCHAR(20)  NOT NULL,
    fecha_designacion DATETIME2(3) NOT NULL
);
GO

CREATE TABLE dbo.Mercado
(
    id_mercado     INT           IDENTITY(1,1) NOT NULL,
    id_evento      INT           NOT NULL,
    nombre         NVARCHAR(50)  NOT NULL,
    descripcion    NVARCHAR(255) NULL,
    fecha_apertura DATETIME2(3)  NOT NULL,
    fecha_cierre   DATETIME2(3)  NOT NULL,
    estado         VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.OpcionApuesta
(
    id_opcion     INT           IDENTITY(1,1) NOT NULL,
    id_mercado    INT           NOT NULL,
    etiqueta      VARCHAR(20)   NOT NULL,
    cuota_vigente DECIMAL(10,2) NOT NULL,
    estado        VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.HistorialCuota
(
    id_historial      BIGINT        IDENTITY(1,1) NOT NULL,
    id_opcion         INT           NOT NULL,
    valor_cuota       DECIMAL(10,2) NOT NULL,
    fecha_hora_cambio DATETIME2(3)  NOT NULL,
    motivo            NVARCHAR(255) NULL
);
GO

/* ============================== DOMINIO 3 - APUESTAS ======================== */

CREATE TABLE dbo.Apuesta
(
    id_apuesta          INT           IDENTITY(1,1) NOT NULL,
    id_usuario          INT           NOT NULL,
    id_opcion           INT           NOT NULL,
    id_tipo_saldo       INT           NOT NULL,
    monto               DECIMAL(18,2) NOT NULL,
    cuota_congelada     DECIMAL(10,2) NOT NULL,
    tipo_apuesta        VARCHAR(20)   NOT NULL,
    estado              VARCHAR(20)   NOT NULL,
    fecha_hora_registro DATETIME2(3)  NOT NULL
);
GO

CREATE TABLE dbo.FavoritoEquipo
(
    id_favorito   INT          IDENTITY(1,1) NOT NULL,
    id_usuario    INT          NOT NULL,
    id_equipo     INT          NOT NULL,
    fecha_marcado DATETIME2(3) NOT NULL
);
GO

/* =========================== DOMINIO 4 - SALDO FICTICIO ===================== */

CREATE TABLE dbo.TipoSaldo
(
    id_tipo_saldo INT           IDENTITY(1,1) NOT NULL,
    nombre        VARCHAR(20)   NOT NULL,
    descripcion   NVARCHAR(255) NULL,
    estado        VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.SaldoCuenta
(
    id_saldo_cuenta            INT           IDENTITY(1,1) NOT NULL,
    id_usuario                 INT           NOT NULL,
    id_tipo_saldo              INT           NOT NULL,
    saldo_actual               DECIMAL(18,2) NOT NULL,
    fecha_ultima_actualizacion DATETIME2(3)  NOT NULL
);
GO

CREATE TABLE dbo.TipoMovimientoSaldo
(
    id_tipo_movimiento INT           IDENTITY(1,1) NOT NULL,
    nombre             VARCHAR(20)   NOT NULL,
    naturaleza         VARCHAR(10)   NOT NULL,
    descripcion        NVARCHAR(255) NULL
);
GO

CREATE TABLE dbo.MovimientoSaldo
(
    id_movimiento      BIGINT        IDENTITY(1,1) NOT NULL,
    id_saldo_cuenta    INT           NOT NULL,
    id_tipo_movimiento INT           NOT NULL,
    id_apuesta         INT           NULL,
    id_recarga         INT           NULL,
    monto              DECIMAL(18,2) NOT NULL,
    saldo_resultante   DECIMAL(18,2) NOT NULL,
    fecha_hora         DATETIME2(3)  NOT NULL,
    referencia         NVARCHAR(100) NULL
);
GO

CREATE TABLE dbo.Recarga
(
    id_recarga    INT           IDENTITY(1,1) NOT NULL,
    id_usuario    INT           NOT NULL,
    id_tipo_saldo INT           NOT NULL,
    monto         DECIMAL(18,2) NOT NULL,
    fecha_hora    DATETIME2(3)  NOT NULL,
    estado        VARCHAR(20)   NOT NULL,
    observacion   NVARCHAR(255) NULL
);
GO

/* ====================== DOMINIO 5 - RESULTADOS Y LIQUIDACION ================ */

CREATE TABLE dbo.Resultado
(
    id_resultado       INT          IDENTITY(1,1) NOT NULL,
    id_evento          INT          NOT NULL,
    marcador_local     SMALLINT     NOT NULL,
    marcador_visitante SMALLINT     NOT NULL,
    fecha_registro     DATETIME2(3) NOT NULL,
    estado             VARCHAR(20)  NOT NULL
);
GO

CREATE TABLE dbo.Liquidacion
(
    id_liquidacion        INT           IDENTITY(1,1) NOT NULL,
    id_apuesta            INT           NOT NULL,
    id_resultado          INT           NOT NULL,
    resultado_liquidacion VARCHAR(20)   NOT NULL,
    monto_premio          DECIMAL(18,2) NOT NULL,
    fecha_hora            DATETIME2(3)  NOT NULL,
    estado                VARCHAR(20)   NOT NULL
);
GO

/* ======================= DOMINIO 6 - AUDITORIA Y SOPORTE ==================== */

CREATE TABLE dbo.Notificacion
(
    id_notificacion BIGINT        IDENTITY(1,1) NOT NULL,
    id_usuario      INT           NOT NULL,
    mensaje         NVARCHAR(500) NOT NULL,
    tipo            NVARCHAR(40)  NOT NULL,
    fecha_hora      DATETIME2(3)  NOT NULL,
    estado          VARCHAR(20)   NOT NULL
);
GO

CREATE TABLE dbo.Auditoria
(
    id_auditoria     BIGINT        IDENTITY(1,1) NOT NULL,
    id_usuario       INT           NULL,
    operacion        NVARCHAR(50)  NOT NULL,
    entidad_afectada NVARCHAR(50)  NOT NULL,
    descripcion      NVARCHAR(500) NULL,
    fecha_hora       DATETIME2(3)  NOT NULL,
    resultado        VARCHAR(20)   NOT NULL,
    direccion_origen VARCHAR(45)   NULL
);
GO

PRINT '29 tablas creadas correctamente.';
GO
