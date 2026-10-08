# Diccionario conceptual — ApuestaDB (Modelo Conceptual · Fase 2)

**Fuente exclusiva:** Fase 1. **Nivel:** conceptual (atributos del negocio).
> Este documento responde a la tarea 7.
> **Naturaleza del atributo:** simple · compuesto · derivado · multivaluado.
> **Obligatoriedad:** obligatorio · opcional.
> **No** se definen claves, tipos de datos ni motor.

---

## Dominio 1 — Seguridad y usuarios

### E-01 · Rol
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | etiqueta del rol (usuario, administrador) | simple | obligatorio |
| descripcion | alcance del rol | simple | opcional |
| estado | vigente / inactivo | simple | obligatorio |

### E-02 · Usuario
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombres | nombre(s) de la persona | simple | obligatorio |
| apellidos | apellido(s) de la persona | simple | obligatorio |
| nombre_completo | composición de nombres + apellidos | **derivado** | — |
| correo | dirección de contacto y de acceso | simple | obligatorio |
| contrasena | credencial almacenada de forma protegida (hash) | simple | obligatorio |
| telefono | número(s) de contacto | multivaluado | opcional |
| estado | activo / inhabilitado | simple | obligatorio |
| fecha_registro | cuándo se creó la cuenta | simple | obligatorio |

### E-03 · PreguntaSeguridad
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| enunciado | texto de la pregunta | simple | obligatorio |
| estado | vigente / inactiva | simple | obligatorio |

### E-04 · RespuestaSeguridad
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| respuesta | respuesta configurada, almacenada protegida | simple | obligatorio |
| fecha_registro | cuándo se configuró | simple | obligatorio |

### E-05 · TokenRecuperacion
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| valor_token | identificador temporal del proceso | simple | obligatorio |
| fecha_emision | cuándo se generó | simple | obligatorio |
| fecha_expiracion | límite de vigencia | simple | obligatorio |
| estado | vigente / usado / expirado | simple | obligatorio |

---

## Dominio 2 — Catálogo deportivo

### E-06 · Pais
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | nombre del país | simple | obligatorio |
| codigo | código normalizado del país | simple | opcional |

### E-07 · Ciudad
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | nombre de la ciudad | simple | obligatorio |
| region | departamento o región | simple | opcional |

### E-08 · Estadio
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | nombre del escenario | simple | obligatorio |
| capacidad | aforo del escenario | simple | opcional |
| direccion | ubicación física | simple | opcional |

### E-09 · Deporte
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | nombre del deporte (fútbol) | simple | obligatorio |
| descripcion | detalle del deporte | simple | opcional |
| estado | vigente / inactivo | simple | obligatorio |

### E-10 · Liga
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | nombre de la liga o torneo | simple | obligatorio |
| categoria | división o categoría | simple | opcional |
| estado | vigente / inactiva | simple | obligatorio |

### E-11 · Temporada
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| etiqueta | nombre del período (p. ej. 2026) | simple | obligatorio |
| fecha_inicio | inicio de la temporada | simple | obligatorio |
| fecha_fin | fin de la temporada | simple | obligatorio |
| estado | en curso / finalizada | simple | obligatorio |

### E-12 · Equipo
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | nombre del equipo | simple | obligatorio |
| siglas | abreviatura o nombre corto | simple | opcional |
| fecha_fundacion | cuándo se fundó | simple | opcional |
| estado | vigente / inactivo | simple | obligatorio |

### E-13 · Arbitro
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombres | nombre(s) del árbitro | simple | obligatorio |
| apellidos | apellido(s) del árbitro | simple | obligatorio |
| categoria | nivel o categoría arbitral | simple | opcional |
| estado | vigente / inactivo | simple | obligatorio |

### E-14 · Evento
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| fecha_hora_inicio | cuándo comienza el encuentro | simple | obligatorio |
| estado | programado / en curso / finalizado / cancelado / suspendido | simple | obligatorio |
| descripcion | observaciones del encuentro | simple | opcional |
| marcador | resultado del encuentro | **derivado** (de E-26) | — |

### E-15 · CalendarioArbitro
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| rol_arbitro | función en el evento (principal / asistente) | simple | obligatorio |
| fecha_designacion | cuándo se asignó | simple | obligatorio |

### E-16 · Mercado
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | tipo de mercado (resultado del partido) | simple | obligatorio |
| descripcion | explicación del mercado | simple | opcional |
| fecha_apertura | cuándo se abre | simple | obligatorio |
| fecha_cierre | cuándo se cierra | simple | obligatorio |
| estado | abierto / cerrado / anulado | simple | obligatorio |

### E-17 · OpcionApuesta
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| etiqueta | resultado posible (local / empate / visitante) | simple | obligatorio |
| cuota_vigente | cuota actual ofrecida | **derivado** (de E-18) | obligatorio |
| estado | habilitada / deshabilitada | simple | obligatorio |

### E-18 · HistorialCuota
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| valor_cuota | cuota registrada | simple | obligatorio |
| fecha_hora_cambio | cuándo se registró el cambio | simple | obligatorio |
| motivo | razón del cambio | simple | opcional |

---

## Dominio 3 — Apuestas

### E-19 · Apuesta
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| monto | valor apostado | simple | obligatorio |
| cuota_congelada | cuota aceptada al registrar (RN-10) | simple | obligatorio |
| tipo_apuesta | modalidad (simple) | simple | obligatorio |
| estado | pendiente / ganada / perdida / anulada | simple | obligatorio |
| fecha_hora_registro | cuándo se realizó | simple | obligatorio |

### E-20 · FavoritoEquipo
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| fecha_marcado | cuándo se marcó como favorito | simple | obligatorio |

---

## Dominio 4 — Saldo ficticio

### E-21 · TipoSaldo
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | tipo de saldo (tokens / PSE) | simple | obligatorio |
| descripcion | explicación del tipo | simple | opcional |
| estado | vigente / inactivo | simple | obligatorio |

### E-22 · SaldoCuenta
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| saldo_actual | valor disponible del tipo | simple | obligatorio |
| fecha_ultima_actualizacion | último cambio | simple | obligatorio |

### E-23 · MovimientoSaldo
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| clase_movimiento | débito / crédito | simple | obligatorio |
| concepto | motivo del movimiento (vía E-24) | simple | obligatorio |
| monto | valor del movimiento | simple | obligatorio |
| saldo_resultante | saldo tras el movimiento | simple | obligatorio |
| fecha_hora | cuándo ocurrió | simple | obligatorio |
| referencia | vínculo con apuesta o recarga | simple | opcional |

### E-24 · TipoMovimientoSaldo
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| nombre | concepto (apuesta / premio / recarga / ajuste) | simple | obligatorio |
| naturaleza | débito / crédito | simple | obligatorio |
| descripcion | explicación | simple | opcional |

### E-25 · Recarga
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| monto | valor recargado | simple | obligatorio |
| fecha_hora | cuándo se realizó | simple | obligatorio |
| estado | aplicada / anulada | simple | obligatorio |
| observacion | nota del administrador | simple | opcional |

---

## Dominio 5 — Resultados y liquidación

### E-26 · Resultado
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| opcion_ganadora | resultado oficial (local / empate / visitante) | simple | obligatorio |
| marcador_local | goles/anotaciones del local | simple | obligatorio |
| marcador_visitante | goles/anotaciones del visitante | simple | obligatorio |
| fecha_registro | cuándo se registró | simple | obligatorio |
| estado | oficial / provisional | simple | obligatorio |

### E-27 · Liquidacion
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| resultado_liquidacion | ganada / perdida / anulada | simple | obligatorio |
| monto_premio | premio abonado (monto × cuota) | simple | obligatorio |
| fecha_hora | cuándo se liquidó | simple | obligatorio |
| estado | aplicada / revertida | simple | obligatorio |

---

## Dominio 6 — Auditoría y soporte

### E-28 · Notificacion
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| mensaje | contenido del aviso | simple | obligatorio |
| tipo | clase de aviso | simple | obligatorio |
| fecha_hora | cuándo se generó | simple | obligatorio |
| estado | no leída / leída | simple | obligatorio |

### E-29 · Auditoria
| Atributo | Descripción | Naturaleza | Obligatoriedad |
|---|---|---|---|
| operacion | acción realizada (login, apuesta, liquidación, cambio) | simple | obligatorio |
| entidad_afectada | sobre qué se actuó | simple | obligatorio |
| descripcion | detalle de la operación | simple | opcional |
| fecha_hora | cuándo ocurrió | simple | obligatorio |
| resultado | éxito / fallo | simple | obligatorio |
| direccion_origen | origen de la operación | simple | opcional |
