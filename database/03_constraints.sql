/* ============================================================================
   APUESTADB - 03_constraints.sql
   Objetivo : Agregar PRIMARY KEY, UNIQUE, CHECK, DEFAULT y FOREIGN KEY.
   Orden    : 1) PK  2) UNIQUE  3) CHECK  4) DEFAULT  5) FK
              (las FK van al final: necesitan que existan las claves referenciadas)
   Requiere : 01_database.sql y 02_tables.sql ejecutados.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ==========================================================================
   1. PRIMARY KEY (clustered)
   ========================================================================== */
ALTER TABLE dbo.Rol                ADD CONSTRAINT PK_Rol                PRIMARY KEY CLUSTERED (id_rol);
ALTER TABLE dbo.Usuario            ADD CONSTRAINT PK_Usuario            PRIMARY KEY CLUSTERED (id_usuario);
ALTER TABLE dbo.PreguntaSeguridad  ADD CONSTRAINT PK_PreguntaSeguridad  PRIMARY KEY CLUSTERED (id_pregunta);
ALTER TABLE dbo.RespuestaSeguridad ADD CONSTRAINT PK_RespuestaSeguridad PRIMARY KEY CLUSTERED (id_respuesta);
ALTER TABLE dbo.TokenRecuperacion  ADD CONSTRAINT PK_TokenRecuperacion  PRIMARY KEY CLUSTERED (id_token);
ALTER TABLE dbo.Pais               ADD CONSTRAINT PK_Pais               PRIMARY KEY CLUSTERED (id_pais);
ALTER TABLE dbo.Ciudad             ADD CONSTRAINT PK_Ciudad             PRIMARY KEY CLUSTERED (id_ciudad);
ALTER TABLE dbo.Estadio            ADD CONSTRAINT PK_Estadio            PRIMARY KEY CLUSTERED (id_estadio);
ALTER TABLE dbo.Deporte            ADD CONSTRAINT PK_Deporte            PRIMARY KEY CLUSTERED (id_deporte);
ALTER TABLE dbo.Liga               ADD CONSTRAINT PK_Liga               PRIMARY KEY CLUSTERED (id_liga);
ALTER TABLE dbo.Temporada          ADD CONSTRAINT PK_Temporada          PRIMARY KEY CLUSTERED (id_temporada);
ALTER TABLE dbo.Equipo             ADD CONSTRAINT PK_Equipo             PRIMARY KEY CLUSTERED (id_equipo);
ALTER TABLE dbo.Arbitro            ADD CONSTRAINT PK_Arbitro            PRIMARY KEY CLUSTERED (id_arbitro);
ALTER TABLE dbo.Evento             ADD CONSTRAINT PK_Evento             PRIMARY KEY CLUSTERED (id_evento);
ALTER TABLE dbo.CalendarioArbitro  ADD CONSTRAINT PK_CalendarioArbitro  PRIMARY KEY CLUSTERED (id_calendario);
ALTER TABLE dbo.Mercado            ADD CONSTRAINT PK_Mercado            PRIMARY KEY CLUSTERED (id_mercado);
ALTER TABLE dbo.OpcionApuesta      ADD CONSTRAINT PK_OpcionApuesta      PRIMARY KEY CLUSTERED (id_opcion);
ALTER TABLE dbo.HistorialCuota     ADD CONSTRAINT PK_HistorialCuota     PRIMARY KEY CLUSTERED (id_historial);
ALTER TABLE dbo.Apuesta            ADD CONSTRAINT PK_Apuesta            PRIMARY KEY CLUSTERED (id_apuesta);
ALTER TABLE dbo.FavoritoEquipo     ADD CONSTRAINT PK_FavoritoEquipo     PRIMARY KEY CLUSTERED (id_favorito);
ALTER TABLE dbo.TipoSaldo          ADD CONSTRAINT PK_TipoSaldo          PRIMARY KEY CLUSTERED (id_tipo_saldo);
ALTER TABLE dbo.SaldoCuenta        ADD CONSTRAINT PK_SaldoCuenta        PRIMARY KEY CLUSTERED (id_saldo_cuenta);
ALTER TABLE dbo.TipoMovimientoSaldo ADD CONSTRAINT PK_TipoMovimientoSaldo PRIMARY KEY CLUSTERED (id_tipo_movimiento);
ALTER TABLE dbo.MovimientoSaldo    ADD CONSTRAINT PK_MovimientoSaldo    PRIMARY KEY CLUSTERED (id_movimiento);
ALTER TABLE dbo.Recarga            ADD CONSTRAINT PK_Recarga            PRIMARY KEY CLUSTERED (id_recarga);
ALTER TABLE dbo.Resultado          ADD CONSTRAINT PK_Resultado          PRIMARY KEY CLUSTERED (id_resultado);
ALTER TABLE dbo.Liquidacion        ADD CONSTRAINT PK_Liquidacion        PRIMARY KEY CLUSTERED (id_liquidacion);
ALTER TABLE dbo.Notificacion       ADD CONSTRAINT PK_Notificacion       PRIMARY KEY CLUSTERED (id_notificacion);
ALTER TABLE dbo.Auditoria          ADD CONSTRAINT PK_Auditoria          PRIMARY KEY CLUSTERED (id_auditoria);
GO

/* ==========================================================================
   2. UNIQUE (claves candidatas)
   ========================================================================== */
ALTER TABLE dbo.Rol                ADD CONSTRAINT UQ_Rol_nombre                UNIQUE (nombre);
ALTER TABLE dbo.Usuario            ADD CONSTRAINT UQ_Usuario_correo            UNIQUE (correo);
ALTER TABLE dbo.PreguntaSeguridad  ADD CONSTRAINT UQ_PreguntaSeguridad_enunciado UNIQUE (enunciado);
ALTER TABLE dbo.RespuestaSeguridad ADD CONSTRAINT UQ_RespuestaSeguridad        UNIQUE (id_usuario, id_pregunta);
ALTER TABLE dbo.TokenRecuperacion  ADD CONSTRAINT UQ_TokenRecuperacion_valor   UNIQUE (valor_token);
ALTER TABLE dbo.Pais               ADD CONSTRAINT UQ_Pais_nombre               UNIQUE (nombre);
ALTER TABLE dbo.Pais               ADD CONSTRAINT UQ_Pais_codigo               UNIQUE (codigo);
ALTER TABLE dbo.Ciudad             ADD CONSTRAINT UQ_Ciudad                    UNIQUE (id_pais, nombre);
ALTER TABLE dbo.Estadio            ADD CONSTRAINT UQ_Estadio                   UNIQUE (id_ciudad, nombre);
ALTER TABLE dbo.Deporte            ADD CONSTRAINT UQ_Deporte_nombre            UNIQUE (nombre);
ALTER TABLE dbo.Liga               ADD CONSTRAINT UQ_Liga                      UNIQUE (id_deporte, nombre);
ALTER TABLE dbo.Temporada          ADD CONSTRAINT UQ_Temporada                 UNIQUE (id_liga, etiqueta);
ALTER TABLE dbo.Equipo             ADD CONSTRAINT UQ_Equipo                    UNIQUE (id_deporte, nombre);
ALTER TABLE dbo.Evento             ADD CONSTRAINT UQ_Evento                    UNIQUE (id_temporada, id_equipo_local, id_equipo_visitante, fecha_hora_inicio);
ALTER TABLE dbo.CalendarioArbitro  ADD CONSTRAINT UQ_CalendarioArbitro         UNIQUE (id_evento, id_arbitro);
ALTER TABLE dbo.Mercado            ADD CONSTRAINT UQ_Mercado                   UNIQUE (id_evento, nombre);
ALTER TABLE dbo.OpcionApuesta      ADD CONSTRAINT UQ_OpcionApuesta             UNIQUE (id_mercado, etiqueta);
ALTER TABLE dbo.HistorialCuota     ADD CONSTRAINT UQ_HistorialCuota            UNIQUE (id_opcion, fecha_hora_cambio);
ALTER TABLE dbo.Apuesta            ADD CONSTRAINT UQ_Apuesta                   UNIQUE (id_usuario, id_opcion, fecha_hora_registro);
ALTER TABLE dbo.FavoritoEquipo     ADD CONSTRAINT UQ_FavoritoEquipo            UNIQUE (id_usuario, id_equipo);
ALTER TABLE dbo.TipoSaldo          ADD CONSTRAINT UQ_TipoSaldo_nombre          UNIQUE (nombre);
ALTER TABLE dbo.SaldoCuenta        ADD CONSTRAINT UQ_SaldoCuenta               UNIQUE (id_usuario, id_tipo_saldo);
ALTER TABLE dbo.TipoMovimientoSaldo ADD CONSTRAINT UQ_TipoMovimientoSaldo_nombre UNIQUE (nombre);
ALTER TABLE dbo.Recarga            ADD CONSTRAINT UQ_Recarga                   UNIQUE (id_usuario, id_tipo_saldo, fecha_hora);
ALTER TABLE dbo.Resultado          ADD CONSTRAINT UQ_Resultado                 UNIQUE (id_evento);
ALTER TABLE dbo.Liquidacion        ADD CONSTRAINT UQ_Liquidacion               UNIQUE (id_apuesta);
GO

/* ==========================================================================
   3. CHECK (dominios y coherencia)
   ========================================================================== */
ALTER TABLE dbo.Rol ADD CONSTRAINT CK_Rol_nombre CHECK (nombre IN ('usuario','administrador'));
ALTER TABLE dbo.Rol ADD CONSTRAINT CK_Rol_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.Usuario ADD CONSTRAINT CK_Usuario_estado CHECK (estado IN ('activo','inhabilitado'));
ALTER TABLE dbo.PreguntaSeguridad ADD CONSTRAINT CK_PreguntaSeguridad_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.TokenRecuperacion ADD CONSTRAINT CK_TokenRecuperacion_estado CHECK (estado IN ('vigente','usado','expirado'));
ALTER TABLE dbo.TokenRecuperacion ADD CONSTRAINT CK_TokenRecuperacion_fechas CHECK (fecha_expiracion > fecha_emision);
ALTER TABLE dbo.Estadio ADD CONSTRAINT CK_Estadio_capacidad CHECK (capacidad IS NULL OR capacidad >= 0);
ALTER TABLE dbo.Deporte ADD CONSTRAINT CK_Deporte_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.Liga ADD CONSTRAINT CK_Liga_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.Temporada ADD CONSTRAINT CK_Temporada_estado CHECK (estado IN ('en_curso','finalizada'));
ALTER TABLE dbo.Temporada ADD CONSTRAINT CK_Temporada_fechas CHECK (fecha_inicio <= fecha_fin);
ALTER TABLE dbo.Equipo ADD CONSTRAINT CK_Equipo_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.Arbitro ADD CONSTRAINT CK_Arbitro_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.Evento ADD CONSTRAINT CK_Evento_estado CHECK (estado IN ('programado','en_curso','finalizado','cancelado','suspendido'));
ALTER TABLE dbo.Evento ADD CONSTRAINT CK_Evento_equipos CHECK (id_equipo_local <> id_equipo_visitante);
ALTER TABLE dbo.CalendarioArbitro ADD CONSTRAINT CK_CalendarioArbitro_rol CHECK (rol_arbitro IN ('principal','asistente'));
ALTER TABLE dbo.Mercado ADD CONSTRAINT CK_Mercado_estado CHECK (estado IN ('abierto','cerrado','anulado'));
ALTER TABLE dbo.Mercado ADD CONSTRAINT CK_Mercado_fechas CHECK (fecha_apertura <= fecha_cierre);
ALTER TABLE dbo.OpcionApuesta ADD CONSTRAINT CK_OpcionApuesta_etiqueta CHECK (etiqueta IN ('local','empate','visitante'));
ALTER TABLE dbo.OpcionApuesta ADD CONSTRAINT CK_OpcionApuesta_cuota CHECK (cuota_vigente > 0);
ALTER TABLE dbo.OpcionApuesta ADD CONSTRAINT CK_OpcionApuesta_estado CHECK (estado IN ('habilitada','deshabilitada'));
ALTER TABLE dbo.HistorialCuota ADD CONSTRAINT CK_HistorialCuota_valor CHECK (valor_cuota > 0);
ALTER TABLE dbo.Apuesta ADD CONSTRAINT CK_Apuesta_monto CHECK (monto > 0);
ALTER TABLE dbo.Apuesta ADD CONSTRAINT CK_Apuesta_cuota CHECK (cuota_congelada > 0);
ALTER TABLE dbo.Apuesta ADD CONSTRAINT CK_Apuesta_tipo CHECK (tipo_apuesta IN ('simple'));
ALTER TABLE dbo.Apuesta ADD CONSTRAINT CK_Apuesta_estado CHECK (estado IN ('pendiente','ganada','perdida','anulada'));
ALTER TABLE dbo.TipoSaldo ADD CONSTRAINT CK_TipoSaldo_nombre CHECK (nombre IN ('tokens','PSE'));
ALTER TABLE dbo.TipoSaldo ADD CONSTRAINT CK_TipoSaldo_estado CHECK (estado IN ('vigente','inactivo'));
ALTER TABLE dbo.SaldoCuenta ADD CONSTRAINT CK_SaldoCuenta_saldo CHECK (saldo_actual >= 0);
ALTER TABLE dbo.TipoMovimientoSaldo ADD CONSTRAINT CK_TipoMovimientoSaldo_nombre CHECK (nombre IN ('apuesta','premio','recarga','ajuste'));
ALTER TABLE dbo.TipoMovimientoSaldo ADD CONSTRAINT CK_TipoMovimientoSaldo_naturaleza CHECK (naturaleza IN ('debito','credito'));
ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT CK_MovimientoSaldo_monto CHECK (monto > 0);
ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT CK_MovimientoSaldo_saldo CHECK (saldo_resultante >= 0);
ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT CK_MovimientoSaldo_origen CHECK (id_apuesta IS NULL OR id_recarga IS NULL);
ALTER TABLE dbo.Recarga ADD CONSTRAINT CK_Recarga_monto CHECK (monto > 0);
ALTER TABLE dbo.Recarga ADD CONSTRAINT CK_Recarga_estado CHECK (estado IN ('aplicada','anulada'));
ALTER TABLE dbo.Resultado ADD CONSTRAINT CK_Resultado_marcadores CHECK (marcador_local >= 0 AND marcador_visitante >= 0);
ALTER TABLE dbo.Resultado ADD CONSTRAINT CK_Resultado_estado CHECK (estado IN ('oficial','provisional'));
ALTER TABLE dbo.Liquidacion ADD CONSTRAINT CK_Liquidacion_resultado CHECK (resultado_liquidacion IN ('ganada','perdida','anulada'));
ALTER TABLE dbo.Liquidacion ADD CONSTRAINT CK_Liquidacion_premio CHECK (monto_premio >= 0);
ALTER TABLE dbo.Liquidacion ADD CONSTRAINT CK_Liquidacion_estado CHECK (estado IN ('aplicada','revertida'));
ALTER TABLE dbo.Notificacion ADD CONSTRAINT CK_Notificacion_estado CHECK (estado IN ('no_leida','leida'));
ALTER TABLE dbo.Auditoria ADD CONSTRAINT CK_Auditoria_resultado CHECK (resultado IN ('exito','fallo'));
GO

/* ==========================================================================
   4. DEFAULT
   ========================================================================== */
ALTER TABLE dbo.Rol                ADD CONSTRAINT DF_Rol_estado                 DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.Usuario            ADD CONSTRAINT DF_Usuario_estado             DEFAULT ('activo')      FOR estado;
ALTER TABLE dbo.Usuario            ADD CONSTRAINT DF_Usuario_fecha_registro     DEFAULT (SYSDATETIME()) FOR fecha_registro;
ALTER TABLE dbo.PreguntaSeguridad  ADD CONSTRAINT DF_PreguntaSeguridad_estado   DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.RespuestaSeguridad ADD CONSTRAINT DF_RespuestaSeguridad_fecha   DEFAULT (SYSDATETIME()) FOR fecha_registro;
ALTER TABLE dbo.TokenRecuperacion  ADD CONSTRAINT DF_TokenRecuperacion_emision  DEFAULT (SYSDATETIME()) FOR fecha_emision;
ALTER TABLE dbo.TokenRecuperacion  ADD CONSTRAINT DF_TokenRecuperacion_estado   DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.Deporte            ADD CONSTRAINT DF_Deporte_estado             DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.Liga               ADD CONSTRAINT DF_Liga_estado                DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.Temporada          ADD CONSTRAINT DF_Temporada_estado           DEFAULT ('en_curso')    FOR estado;
ALTER TABLE dbo.Equipo             ADD CONSTRAINT DF_Equipo_estado              DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.Arbitro            ADD CONSTRAINT DF_Arbitro_estado             DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.Evento             ADD CONSTRAINT DF_Evento_estado              DEFAULT ('programado')  FOR estado;
ALTER TABLE dbo.CalendarioArbitro  ADD CONSTRAINT DF_CalendarioArbitro_rol      DEFAULT ('principal')   FOR rol_arbitro;
ALTER TABLE dbo.CalendarioArbitro  ADD CONSTRAINT DF_CalendarioArbitro_fecha    DEFAULT (SYSDATETIME()) FOR fecha_designacion;
ALTER TABLE dbo.Mercado            ADD CONSTRAINT DF_Mercado_apertura           DEFAULT (SYSDATETIME()) FOR fecha_apertura;
ALTER TABLE dbo.Mercado            ADD CONSTRAINT DF_Mercado_estado             DEFAULT ('abierto')     FOR estado;
ALTER TABLE dbo.OpcionApuesta      ADD CONSTRAINT DF_OpcionApuesta_estado       DEFAULT ('habilitada')  FOR estado;
ALTER TABLE dbo.HistorialCuota     ADD CONSTRAINT DF_HistorialCuota_fecha       DEFAULT (SYSDATETIME()) FOR fecha_hora_cambio;
ALTER TABLE dbo.Apuesta            ADD CONSTRAINT DF_Apuesta_tipo               DEFAULT ('simple')      FOR tipo_apuesta;
ALTER TABLE dbo.Apuesta            ADD CONSTRAINT DF_Apuesta_estado             DEFAULT ('pendiente')   FOR estado;
ALTER TABLE dbo.Apuesta            ADD CONSTRAINT DF_Apuesta_fecha              DEFAULT (SYSDATETIME()) FOR fecha_hora_registro;
ALTER TABLE dbo.FavoritoEquipo     ADD CONSTRAINT DF_FavoritoEquipo_fecha       DEFAULT (SYSDATETIME()) FOR fecha_marcado;
ALTER TABLE dbo.TipoSaldo          ADD CONSTRAINT DF_TipoSaldo_estado           DEFAULT ('vigente')     FOR estado;
ALTER TABLE dbo.SaldoCuenta        ADD CONSTRAINT DF_SaldoCuenta_saldo          DEFAULT (0)             FOR saldo_actual;
ALTER TABLE dbo.SaldoCuenta        ADD CONSTRAINT DF_SaldoCuenta_fecha          DEFAULT (SYSDATETIME()) FOR fecha_ultima_actualizacion;
ALTER TABLE dbo.MovimientoSaldo    ADD CONSTRAINT DF_MovimientoSaldo_fecha      DEFAULT (SYSDATETIME()) FOR fecha_hora;
ALTER TABLE dbo.Recarga            ADD CONSTRAINT DF_Recarga_fecha              DEFAULT (SYSDATETIME()) FOR fecha_hora;
ALTER TABLE dbo.Recarga            ADD CONSTRAINT DF_Recarga_estado             DEFAULT ('aplicada')    FOR estado;
ALTER TABLE dbo.Resultado          ADD CONSTRAINT DF_Resultado_marcador_local   DEFAULT (0)             FOR marcador_local;
ALTER TABLE dbo.Resultado          ADD CONSTRAINT DF_Resultado_marcador_visit   DEFAULT (0)             FOR marcador_visitante;
ALTER TABLE dbo.Resultado          ADD CONSTRAINT DF_Resultado_fecha            DEFAULT (SYSDATETIME()) FOR fecha_registro;
ALTER TABLE dbo.Resultado          ADD CONSTRAINT DF_Resultado_estado           DEFAULT ('provisional') FOR estado;
ALTER TABLE dbo.Liquidacion        ADD CONSTRAINT DF_Liquidacion_premio         DEFAULT (0)             FOR monto_premio;
ALTER TABLE dbo.Liquidacion        ADD CONSTRAINT DF_Liquidacion_fecha          DEFAULT (SYSDATETIME()) FOR fecha_hora;
ALTER TABLE dbo.Liquidacion        ADD CONSTRAINT DF_Liquidacion_estado         DEFAULT ('aplicada')    FOR estado;
ALTER TABLE dbo.Notificacion       ADD CONSTRAINT DF_Notificacion_fecha         DEFAULT (SYSDATETIME()) FOR fecha_hora;
ALTER TABLE dbo.Notificacion       ADD CONSTRAINT DF_Notificacion_estado        DEFAULT ('no_leida')    FOR estado;
ALTER TABLE dbo.Auditoria          ADD CONSTRAINT DF_Auditoria_fecha            DEFAULT (SYSDATETIME()) FOR fecha_hora;
GO

/* ==========================================================================
   5. FOREIGN KEY  (al final: dependen de PK/UNIQUE ya creadas)
   ========================================================================== */
ALTER TABLE dbo.Usuario ADD CONSTRAINT FK_Usuario_Rol
    FOREIGN KEY (id_rol) REFERENCES dbo.Rol (id_rol)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.RespuestaSeguridad ADD CONSTRAINT FK_RespuestaSeguridad_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE dbo.RespuestaSeguridad ADD CONSTRAINT FK_RespuestaSeguridad_Pregunta
    FOREIGN KEY (id_pregunta) REFERENCES dbo.PreguntaSeguridad (id_pregunta)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.TokenRecuperacion ADD CONSTRAINT FK_TokenRecuperacion_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE dbo.Ciudad ADD CONSTRAINT FK_Ciudad_Pais
    FOREIGN KEY (id_pais) REFERENCES dbo.Pais (id_pais)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Estadio ADD CONSTRAINT FK_Estadio_Ciudad
    FOREIGN KEY (id_ciudad) REFERENCES dbo.Ciudad (id_ciudad)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Equipo ADD CONSTRAINT FK_Equipo_Deporte
    FOREIGN KEY (id_deporte) REFERENCES dbo.Deporte (id_deporte)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Equipo ADD CONSTRAINT FK_Equipo_Ciudad
    FOREIGN KEY (id_ciudad) REFERENCES dbo.Ciudad (id_ciudad)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Liga ADD CONSTRAINT FK_Liga_Deporte
    FOREIGN KEY (id_deporte) REFERENCES dbo.Deporte (id_deporte)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Temporada ADD CONSTRAINT FK_Temporada_Liga
    FOREIGN KEY (id_liga) REFERENCES dbo.Liga (id_liga)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Evento ADD CONSTRAINT FK_Evento_Temporada
    FOREIGN KEY (id_temporada) REFERENCES dbo.Temporada (id_temporada)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Evento ADD CONSTRAINT FK_Evento_EquipoLocal
    FOREIGN KEY (id_equipo_local) REFERENCES dbo.Equipo (id_equipo)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Evento ADD CONSTRAINT FK_Evento_EquipoVisitante
    FOREIGN KEY (id_equipo_visitante) REFERENCES dbo.Equipo (id_equipo)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Evento ADD CONSTRAINT FK_Evento_Estadio
    FOREIGN KEY (id_estadio) REFERENCES dbo.Estadio (id_estadio)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.CalendarioArbitro ADD CONSTRAINT FK_CalendarioArbitro_Evento
    FOREIGN KEY (id_evento) REFERENCES dbo.Evento (id_evento)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE dbo.CalendarioArbitro ADD CONSTRAINT FK_CalendarioArbitro_Arbitro
    FOREIGN KEY (id_arbitro) REFERENCES dbo.Arbitro (id_arbitro)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Mercado ADD CONSTRAINT FK_Mercado_Evento
    FOREIGN KEY (id_evento) REFERENCES dbo.Evento (id_evento)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.OpcionApuesta ADD CONSTRAINT FK_OpcionApuesta_Mercado
    FOREIGN KEY (id_mercado) REFERENCES dbo.Mercado (id_mercado)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.HistorialCuota ADD CONSTRAINT FK_HistorialCuota_Opcion
    FOREIGN KEY (id_opcion) REFERENCES dbo.OpcionApuesta (id_opcion)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE dbo.Apuesta ADD CONSTRAINT FK_Apuesta_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Apuesta ADD CONSTRAINT FK_Apuesta_Opcion
    FOREIGN KEY (id_opcion) REFERENCES dbo.OpcionApuesta (id_opcion)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Apuesta ADD CONSTRAINT FK_Apuesta_TipoSaldo
    FOREIGN KEY (id_tipo_saldo) REFERENCES dbo.TipoSaldo (id_tipo_saldo)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Apuesta ADD CONSTRAINT FK_Apuesta_SaldoCuenta
    FOREIGN KEY (id_usuario, id_tipo_saldo) REFERENCES dbo.SaldoCuenta (id_usuario, id_tipo_saldo)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.FavoritoEquipo ADD CONSTRAINT FK_FavoritoEquipo_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE dbo.FavoritoEquipo ADD CONSTRAINT FK_FavoritoEquipo_Equipo
    FOREIGN KEY (id_equipo) REFERENCES dbo.Equipo (id_equipo)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE dbo.SaldoCuenta ADD CONSTRAINT FK_SaldoCuenta_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.SaldoCuenta ADD CONSTRAINT FK_SaldoCuenta_TipoSaldo
    FOREIGN KEY (id_tipo_saldo) REFERENCES dbo.TipoSaldo (id_tipo_saldo)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT FK_MovimientoSaldo_SaldoCuenta
    FOREIGN KEY (id_saldo_cuenta) REFERENCES dbo.SaldoCuenta (id_saldo_cuenta)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT FK_MovimientoSaldo_TipoMovimiento
    FOREIGN KEY (id_tipo_movimiento) REFERENCES dbo.TipoMovimientoSaldo (id_tipo_movimiento)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT FK_MovimientoSaldo_Apuesta
    FOREIGN KEY (id_apuesta) REFERENCES dbo.Apuesta (id_apuesta)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.MovimientoSaldo ADD CONSTRAINT FK_MovimientoSaldo_Recarga
    FOREIGN KEY (id_recarga) REFERENCES dbo.Recarga (id_recarga)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Recarga ADD CONSTRAINT FK_Recarga_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Recarga ADD CONSTRAINT FK_Recarga_TipoSaldo
    FOREIGN KEY (id_tipo_saldo) REFERENCES dbo.TipoSaldo (id_tipo_saldo)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Resultado ADD CONSTRAINT FK_Resultado_Evento
    FOREIGN KEY (id_evento) REFERENCES dbo.Evento (id_evento)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Liquidacion ADD CONSTRAINT FK_Liquidacion_Apuesta
    FOREIGN KEY (id_apuesta) REFERENCES dbo.Apuesta (id_apuesta)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE dbo.Liquidacion ADD CONSTRAINT FK_Liquidacion_Resultado
    FOREIGN KEY (id_resultado) REFERENCES dbo.Resultado (id_resultado)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE dbo.Notificacion ADD CONSTRAINT FK_Notificacion_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE dbo.Auditoria ADD CONSTRAINT FK_Auditoria_Usuario
    FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario (id_usuario)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

PRINT 'Restricciones creadas: 29 PK, 26 UNIQUE, CHECK, DEFAULT y 38 FK.';
GO
