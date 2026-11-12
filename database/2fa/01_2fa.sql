/* ============================================================================
   APUESTADB - segundo factor TOTP (Google/Microsoft Authenticator)
   ============================================================================ */

IF OBJECT_ID('dbo.Usuario2FA', 'U') IS NULL
CREATE TABLE dbo.Usuario2FA
(
    id_usuario         INT           NOT NULL PRIMARY KEY,
    secreto_cifrado    VARBINARY(MAX) NULL,
    habilitado         BIT           NOT NULL CONSTRAINT DF_Usuario2FA_Hab DEFAULT 0,
    fecha_creacion     DATETIME2(3)  NOT NULL CONSTRAINT DF_Usuario2FA_Cre DEFAULT SYSUTCDATETIME(),
    fecha_activacion   DATETIME2(3)  NULL,
    ultimo_uso         DATETIME2(3)  NULL,
    intentos_fallidos  INT           NOT NULL CONSTRAINT DF_Usuario2FA_Int DEFAULT 0,
    bloqueado_hasta    DATETIME2(3)  NULL,
    actualizado_en     DATETIME2(3)  NOT NULL CONSTRAINT DF_Usuario2FA_Act DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Usuario2FA_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Usuario2FA_Habilitado' AND object_id = OBJECT_ID('dbo.Usuario2FA'))
    CREATE INDEX IX_Usuario2FA_Habilitado ON dbo.Usuario2FA (habilitado);
GO
