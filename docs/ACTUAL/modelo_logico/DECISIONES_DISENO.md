# Decisiones de diseño — ApuestaDB (Modelo Lógico · Fase 3)

**Fuente:** modelo conceptual aprobado. **Nivel:** lógico relacional. Sin SQL ni tipos de datos.
> Cada decisión incluye la alternativa considerada y el motivo de la elección.

---

### D-01 · Claves primarias sustitutas + claves candidatas naturales
- **Decisión:** cada tabla usa una **clave primaria sustituta** (`id_…`) y, cuando existe, se declara además una **clave candidata natural** (correo, nombre, pares de FKs).
- **Alternativa considerada:** usar solo claves naturales como primarias.
- **Motivo:** las claves sustitutas son estables (no cambian si cambia un dato de negocio) y simplifican las referencias; las claves candidatas naturales se conservan como reglas de unicidad.

### D-02 · Evento–Resultado como tablas separadas (1:1)
- **Decisión:** mantener **Resultado** como tabla propia con FK única `id_evento`.
- **Alternativa considerada:** guardar el resultado dentro de Evento.
- **Motivo:** el resultado se registra **después** de finalizar el evento (participación parcial); separarlo evita columnas vacías y acoplar dos momentos del negocio.

### D-03 · Apuesta–Liquidacion como tablas separadas (1:1)
- **Decisión:** mantener **Liquidacion** como tabla propia con FK **única** `id_apuesta`.
- **Alternativa considerada:** guardar estado y premio dentro de Apuesta.
- **Motivo:** la liquidación es un hecho posterior y **único** por apuesta (RN-14); la unicidad de `id_apuesta` la garantiza y conserva la fecha y el detalle del cierre.

### D-04 · Relaciones N:M resueltas con tablas asociativas
- **Decisión:** materializar las 5 relaciones N:M en tablas asociativas (RespuestaSeguridad, CalendarioArbitro, FavoritoEquipo, SaldoCuenta, Liquidacion).
- **Alternativa considerada:** duplicar datos o usar campos múltiples en una tabla.
- **Motivo:** es la forma correcta de resolver N:M y ubicar los atributos de la relación, evitando redundancia.

### D-05 · Estados como dominio de valores, no como catálogos
- **Decisión:** los estados (Evento, Apuesta, Mercado, Recarga, Resultado…) se representan como **atributos con un dominio acotado de valores**, no como tablas catálogo.
- **Alternativa considerada:** crear tablas `EstadoEvento`, `EstadoApuesta`, etc.
- **Motivo:** son conjuntos pequeños y estables; como catálogos inflarían el modelo sin aportar valor. Quedan como dominio a validar (posible restricción `CHECK` en la fase física).

### D-06 · Teléfono multivaluado simplificado
- **Decisión:** `Usuario.telefono` se trata como **atributo simple opcional** (un solo número).
- **Alternativa considerada:** crear una tabla `UsuarioTelefono`.
- **Motivo:** ningún requisito exige múltiples teléfonos (RF-01 no lo pide). Si más adelante se requieren varios, se creará su tabla (quedaría como tabla 30).

### D-07 · Atributos compuestos y derivados no almacenados
- **Decisión:** no se almacenan `nombre_completo` (compuesto/derivado) ni `opcion_ganadora` (derivable del marcador, ver D-14); `cuota_vigente` **sí** se conserva como redundancia controlada (ver D-15).
- **Alternativa considerada:** almacenarlos para acelerar consultas.
- **Motivo:** evitan redundancia e inconsistencia; se calculan cuando se necesiten.

### D-08 · Apuesta guarda `id_usuario` + `id_tipo_saldo` (no `id_saldo_cuenta`)
- **Decisión:** Apuesta referencia directamente a Usuario y a TipoSaldo; la cuenta afectada se identifica por el par (`id_usuario`, `id_tipo_saldo`), que además es FK compuesta a SaldoCuenta.
- **Alternativa considerada:** guardar solo `id_saldo_cuenta`.
- **Motivo:** si se guardaran `id_usuario` **y** `id_saldo_cuenta`, existiría una **dependencia transitiva** (`id_saldo_cuenta → id_usuario`) que rompe la 3FN. Guardar usuario + tipo evita la redundancia y conserva la relación directa Usuario–Apuesta (R-20).

### D-09 · MovimientoSaldo con referencias opcionales
- **Decisión:** MovimientoSaldo puede referenciar opcionalmente a Apuesta (`id_apuesta`) o a Recarga (`id_recarga`).
- **Alternativa considerada:** una única columna `referencia` con texto libre.
- **Motivo:** las FK opcionales permiten rastrear el origen exacto del movimiento según su concepto (apuesta/premio vs recarga), manteniendo la trazabilidad (RN-18/RN-19). La columna `referencia` se conserva como apoyo descriptivo.

### D-10 · Catálogos TipoSaldo y TipoMovimientoSaldo
- **Decisión:** mantener **TipoSaldo** (tokens/PSE) y **TipoMovimientoSaldo** (apuesta/premio/recarga/ajuste) como tablas de referencia.
- **Alternativa considerada:** valores fijos en columnas.
- **Motivo:** evitan repetir textos y permiten clasificar de forma consistente; además soportan las reglas de saldo (RN-01..RN-06).

### D-11 · HistorialCuota conserva la evolución de la cuota
- **Decisión:** mantener una tabla de historial con cada cambio de cuota.
- **Alternativa considerada:** guardar solo la cuota vigente.
- **Motivo:** RN-10/RN-11 exigen que un cambio posterior no altere la apuesta; el historial permite verificar qué cuota regía en cada momento.

### D-12 · Entidades de apoyo geográfico y deportivo como tablas propias
- **Decisión:** mantener Pais, Ciudad, Estadio, Liga, Temporada, Deporte, Equipo y Arbitro como tablas normalizadas.
- **Alternativa considerada:** almacenar estos datos como texto dentro de Equipo y Evento.
- **Motivo:** evita repetir información y facilita la integridad y las consultas; es la base para alcanzar formas normales en la auditoría de normalización.

---

### D-13 · Eliminar `MovimientoSaldo.clase_movimiento` (corrección C-1)
- **Decisión:** eliminar el atributo; la clase (débito/crédito) se obtiene de `TipoMovimientoSaldo.naturaleza`.
- **Motivo:** dependencia parcial detectada en la auditoría (Fase 4).

### D-14 · Derivar la opción ganadora (corrección C-2)
- **Decisión:** eliminar `Resultado.opcion_ganadora`; la opción ganadora se deriva del marcador (`marcador_local` vs `marcador_visitante`).
- **Motivo:** dependencia transitiva detectada en la auditoría (Fase 4).

### D-15 · Mantener las 5 redundancias controladas
- **Decisión:** conservar `OpcionApuesta.cuota_vigente`, `SaldoCuenta.saldo_actual`, `MovimientoSaldo.saldo_resultante`, `Liquidacion.monto_premio` y `Liquidacion.resultado_liquidacion`, con mantenimiento transaccional.
- **Motivo:** son derivaciones **entre tablas** (no violan 3FN) y aportan valor operativo/histórico.

---

## Resumen

15 decisiones de diseño documentadas (D-01..D-15). Ninguna introduce tablas adicionales más allá de las **29** ya definidas.
