# Tipos de datos — ApuestaDB (SQL Server · Fase 6)

**Base:** diccionario de datos (Fase 5) · Diseño, sin script SQL.
> Columnas: **Tipo SQL Server** · **Long./Prec.** · **Nulabilidad** · **Valor por defecto** · **Observaciones**.

---

## Dominio 1 — Seguridad y usuarios

### T-01 · Rol
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_rol | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| nombre | VARCHAR(20) | 20 | NOT NULL | — | UQ; CHECK RolNombre |
| descripcion | NVARCHAR | 255 | NULL | — | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-02 · Usuario
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_usuario | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_rol | INT | — | NOT NULL | — | FK → Rol |
| nombres | NVARCHAR | 100 | NOT NULL | — | — |
| apellidos | NVARCHAR | 100 | NOT NULL | — | — |
| correo | NVARCHAR | 150 | NOT NULL | — | UQ |
| contrasena | VARCHAR | 255 | NOT NULL | — | hash (RN-20) |
| telefono | NVARCHAR | 20 | NULL | — | UQ filtrado |
| estado | VARCHAR(20) | 20 | NOT NULL | 'activo' | CHECK EstadoUsuario |
| fecha_registro | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |

### T-03 · PreguntaSeguridad
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_pregunta | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| enunciado | NVARCHAR | 255 | NOT NULL | — | UQ |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-04 · RespuestaSeguridad
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_respuesta | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| id_pregunta | INT | — | NOT NULL | — | FK → PreguntaSeguridad |
| respuesta | VARCHAR | 255 | NOT NULL | — | almacenada protegida |
| fecha_registro | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |

### T-05 · TokenRecuperacion
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_token | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| valor_token | VARCHAR | 128 | NOT NULL | — | UQ |
| fecha_emision | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| fecha_expiracion | DATETIME2(3) | — | NOT NULL | — | CHECK > fecha_emision |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoToken |

---

## Dominio 2 — Catálogo deportivo

### T-06 · Pais
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_pais | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| nombre | NVARCHAR | 100 | NOT NULL | — | UQ |
| codigo | VARCHAR | 10 | NULL | — | UQ |

### T-07 · Ciudad
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_ciudad | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_pais | INT | — | NOT NULL | — | FK → Pais |
| nombre | NVARCHAR | 100 | NOT NULL | — | UQ (id_pais, nombre) |
| region | NVARCHAR | 100 | NULL | — | — |

### T-08 · Estadio
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_estadio | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_ciudad | INT | — | NOT NULL | — | FK → Ciudad |
| nombre | NVARCHAR | 100 | NOT NULL | — | UQ (id_ciudad, nombre) |
| capacidad | INT | — | NULL | — | CHECK ≥ 0 |
| direccion | NVARCHAR | 200 | NULL | — | — |

### T-09 · Deporte
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_deporte | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| nombre | NVARCHAR | 100 | NOT NULL | — | UQ |
| descripcion | NVARCHAR | 255 | NULL | — | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-10 · Liga
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_liga | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_deporte | INT | — | NOT NULL | — | FK → Deporte |
| nombre | NVARCHAR | 100 | NOT NULL | — | UQ (id_deporte, nombre) |
| categoria | NVARCHAR | 50 | NULL | — | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-11 · Temporada
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_temporada | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_liga | INT | — | NOT NULL | — | FK → Liga |
| etiqueta | NVARCHAR | 20 | NOT NULL | — | UQ (id_liga, etiqueta) |
| fecha_inicio | DATE | — | NOT NULL | — | CHECK ≤ fecha_fin |
| fecha_fin | DATE | — | NOT NULL | — | CHECK ≥ fecha_inicio |
| estado | VARCHAR(20) | 20 | NOT NULL | 'en_curso' | CHECK EstadoTemporada |

### T-12 · Equipo
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_equipo | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_deporte | INT | — | NOT NULL | — | FK → Deporte |
| id_ciudad | INT | — | NOT NULL | — | FK → Ciudad |
| nombre | NVARCHAR | 100 | NOT NULL | — | UQ (id_deporte, nombre) |
| siglas | NVARCHAR | 10 | NULL | — | — |
| fecha_fundacion | DATE | — | NULL | — | no futura (regla de proceso) |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-13 · Arbitro
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_arbitro | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| nombres | NVARCHAR | 100 | NOT NULL | — | — |
| apellidos | NVARCHAR | 100 | NOT NULL | — | — |
| categoria | NVARCHAR | 50 | NULL | — | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-14 · Evento
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_evento | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_temporada | INT | — | NOT NULL | — | FK → Temporada |
| id_equipo_local | INT | — | NOT NULL | — | FK → Equipo; ≠ visitante |
| id_equipo_visitante | INT | — | NOT NULL | — | FK → Equipo; ≠ local |
| id_estadio | INT | — | NOT NULL | — | FK → Estadio |
| fecha_hora_inicio | DATETIME2(3) | — | NOT NULL | — | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'programado' | CHECK EstadoEvento |
| descripcion | NVARCHAR | 255 | NULL | — | — |

### T-15 · CalendarioArbitro
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_calendario | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_evento | INT | — | NOT NULL | — | FK → Evento |
| id_arbitro | INT | — | NOT NULL | — | FK → Arbitro |
| rol_arbitro | VARCHAR(20) | 20 | NOT NULL | 'principal' | CHECK RolArbitro |
| fecha_designacion | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |

### T-16 · Mercado
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_mercado | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_evento | INT | — | NOT NULL | — | FK → Evento |
| nombre | NVARCHAR | 50 | NOT NULL | — | UQ (id_evento, nombre) |
| descripcion | NVARCHAR | 255 | NULL | — | — |
| fecha_apertura | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | CHECK ≤ cierre |
| fecha_cierre | DATETIME2(3) | — | NOT NULL | — | CHECK ≥ apertura |
| estado | VARCHAR(20) | 20 | NOT NULL | 'abierto' | CHECK EstadoMercado |

### T-17 · OpcionApuesta
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_opcion | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_mercado | INT | — | NOT NULL | — | FK → Mercado |
| etiqueta | VARCHAR(20) | 20 | NOT NULL | — | CHECK EtiquetaOpcion; UQ (id_mercado, etiqueta) |
| cuota_vigente | DECIMAL(10,2) | 10,2 | NOT NULL | — | CHECK > 0; snapshot controlado |
| estado | VARCHAR(20) | 20 | NOT NULL | 'habilitada' | CHECK EstadoOpcion |

### T-18 · HistorialCuota
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_historial | BIGINT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_opcion | INT | — | NOT NULL | — | FK → OpcionApuesta |
| valor_cuota | DECIMAL(10,2) | 10,2 | NOT NULL | — | CHECK > 0 |
| fecha_hora_cambio | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | UQ (id_opcion, fecha_hora_cambio) |
| motivo | NVARCHAR | 255 | NULL | — | — |

---

## Dominio 3 — Apuestas

### T-19 · Apuesta
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_apuesta | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| id_opcion | INT | — | NOT NULL | — | FK → OpcionApuesta |
| id_tipo_saldo | INT | — | NOT NULL | — | FK → TipoSaldo |
| monto | DECIMAL(18,2) | 18,2 | NOT NULL | — | CHECK > 0 |
| cuota_congelada | DECIMAL(10,2) | 10,2 | NOT NULL | — | CHECK > 0 |
| tipo_apuesta | VARCHAR(20) | 20 | NOT NULL | 'simple' | CHECK TipoApuesta |
| estado | VARCHAR(20) | 20 | NOT NULL | 'pendiente' | CHECK EstadoApuesta |
| fecha_hora_registro | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | UQ (id_usuario, id_opcion, fecha_hora_registro) |

### T-20 · FavoritoEquipo
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_favorito | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| id_equipo | INT | — | NOT NULL | — | FK → Equipo |
| fecha_marcado | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |

---

## Dominio 4 — Saldo ficticio

### T-21 · TipoSaldo
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_tipo_saldo | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| nombre | VARCHAR(20) | 20 | NOT NULL | — | UQ; CHECK TipoSaldoNombre |
| descripcion | NVARCHAR | 255 | NULL | — | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'vigente' | CHECK EstadoGenerico |

### T-22 · SaldoCuenta
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_saldo_cuenta | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| id_tipo_saldo | INT | — | NOT NULL | — | FK → TipoSaldo |
| saldo_actual | DECIMAL(18,2) | 18,2 | NOT NULL | 0 | CHECK ≥ 0; snapshot controlado |
| fecha_ultima_actualizacion | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |

### T-23 · MovimientoSaldo
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_movimiento | BIGINT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_saldo_cuenta | INT | — | NOT NULL | — | FK → SaldoCuenta |
| id_tipo_movimiento | INT | — | NOT NULL | — | FK → TipoMovimientoSaldo |
| id_apuesta | INT | — | NULL | — | FK → Apuesta; excluyente con id_recarga |
| id_recarga | INT | — | NULL | — | FK → Recarga; excluyente con id_apuesta |
| monto | DECIMAL(18,2) | 18,2 | NOT NULL | — | CHECK > 0 |
| saldo_resultante | DECIMAL(18,2) | 18,2 | NOT NULL | — | CHECK ≥ 0; snapshot controlado |
| fecha_hora | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| referencia | NVARCHAR | 100 | NULL | — | — |

### T-24 · TipoMovimientoSaldo
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_tipo_movimiento | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| nombre | VARCHAR(20) | 20 | NOT NULL | — | UQ; CHECK NombreTipoMovimiento |
| naturaleza | VARCHAR(10) | 10 | NOT NULL | — | CHECK NaturalezaMovimiento |
| descripcion | NVARCHAR | 255 | NULL | — | — |

### T-25 · Recarga
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_recarga | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| id_tipo_saldo | INT | — | NOT NULL | — | FK → TipoSaldo |
| monto | DECIMAL(18,2) | 18,2 | NOT NULL | — | CHECK > 0 |
| fecha_hora | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'aplicada' | CHECK EstadoRecarga |
| observacion | NVARCHAR | 255 | NULL | — | — |

---

## Dominio 5 — Resultados y liquidación

### T-26 · Resultado
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_resultado | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_evento | INT | — | NOT NULL | — | FK → Evento; UQ (1:1) |
| marcador_local | SMALLINT | — | NOT NULL | 0 | CHECK ≥ 0 |
| marcador_visitante | SMALLINT | — | NOT NULL | 0 | CHECK ≥ 0 |
| fecha_registro | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'provisional' | CHECK EstadoResultado |

### T-27 · Liquidacion
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_liquidacion | INT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_apuesta | INT | — | NOT NULL | — | FK → Apuesta; UQ (1:1) |
| id_resultado | INT | — | NOT NULL | — | FK → Resultado |
| resultado_liquidacion | VARCHAR(20) | 20 | NOT NULL | — | CHECK ResultadoLiquidacion |
| monto_premio | DECIMAL(18,2) | 18,2 | NOT NULL | 0 | CHECK ≥ 0; snapshot controlado |
| fecha_hora | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'aplicada' | CHECK EstadoLiquidacion |

---

## Dominio 6 — Auditoría y soporte

### T-28 · Notificacion
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_notificacion | BIGINT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NOT NULL | — | FK → Usuario |
| mensaje | NVARCHAR | 500 | NOT NULL | — | — |
| tipo | NVARCHAR | 40 | NOT NULL | — | — |
| fecha_hora | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| estado | VARCHAR(20) | 20 | NOT NULL | 'no_leida' | CHECK EstadoNotificacion |

### T-29 · Auditoria
| Columna | Tipo | Long./Prec. | Nulabilidad | Default | Observaciones |
|---|---|---|---|---|---|
| id_auditoria | BIGINT IDENTITY(1,1) | — | NOT NULL | — | PK |
| id_usuario | INT | — | NULL | — | FK → Usuario (opcional) |
| operacion | NVARCHAR | 50 | NOT NULL | — | — |
| entidad_afectada | NVARCHAR | 50 | NOT NULL | — | — |
| descripcion | NVARCHAR | 500 | NULL | — | — |
| fecha_hora | DATETIME2(3) | — | NOT NULL | SYSDATETIME() | — |
| resultado | VARCHAR(20) | 20 | NOT NULL | — | CHECK ResultadoAuditoria |
| direccion_origen | VARCHAR | 45 | NULL | — | IPv4/IPv6 |
