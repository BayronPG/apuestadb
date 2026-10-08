# Normalización — Primera Forma Normal (1FN)

**Modelo:** lógico relacional de 29 tablas · **Fase 4 (auditoría)** · Sin SQL ni tipos de datos.
> **Definición (1FN):** una relación está en 1FN si **todos sus atributos son atómicos** (no contienen valores compuestos ni listas), **no existen grupos repetitivos** y **cada fila es identificable** por una clave.

---

## 1. Verificación por tabla

| # | Tabla | Atributos atómicos | Grupos repetitivos | Multivaluados | Veredicto |
|---|---|---|---|---|---|
| T-01 | Rol | Sí | No | No | ✅ 1FN |
| T-02 | Usuario | Sí | No | No¹ | ✅ 1FN |
| T-03 | PreguntaSeguridad | Sí | No | No | ✅ 1FN |
| T-04 | RespuestaSeguridad | Sí | No | No | ✅ 1FN |
| T-05 | TokenRecuperacion | Sí | No | No | ✅ 1FN |
| T-06 | Pais | Sí | No | No | ✅ 1FN |
| T-07 | Ciudad | Sí | No | No | ✅ 1FN |
| T-08 | Estadio | Sí | No | No | ✅ 1FN |
| T-09 | Deporte | Sí | No | No | ✅ 1FN |
| T-10 | Liga | Sí | No | No | ✅ 1FN |
| T-11 | Temporada | Sí | No | No | ✅ 1FN |
| T-12 | Equipo | Sí | No | No | ✅ 1FN |
| T-13 | Arbitro | Sí | No | No | ✅ 1FN |
| T-14 | Evento | Sí | No | No | ✅ 1FN |
| T-15 | CalendarioArbitro | Sí | No | No | ✅ 1FN |
| T-16 | Mercado | Sí | No | No | ✅ 1FN |
| T-17 | OpcionApuesta | Sí | No | No | ✅ 1FN |
| T-18 | HistorialCuota | Sí | No | No | ✅ 1FN |
| T-19 | Apuesta | Sí | No | No | ✅ 1FN |
| T-20 | FavoritoEquipo | Sí | No | No | ✅ 1FN |
| T-21 | TipoSaldo | Sí | No | No | ✅ 1FN |
| T-22 | SaldoCuenta | Sí | No | No | ✅ 1FN |
| T-23 | MovimientoSaldo | Sí | No | No | ✅ 1FN |
| T-24 | TipoMovimientoSaldo | Sí | No | No | ✅ 1FN |
| T-25 | Recarga | Sí | No | No | ✅ 1FN |
| T-26 | Resultado | Sí | No | No | ✅ 1FN |
| T-27 | Liquidacion | Sí | No | No | ✅ 1FN |
| T-28 | Notificacion | Sí | No | No | ✅ 1FN |
| T-29 | Auditoria | Sí | No | No | ✅ 1FN |

¹ Ver decisión D-06: `Usuario.telefono` se trató como atributo **simple opcional** (un solo número). Si se exigieran varios teléfonos, sería un atributo multivaluado y **rompería la 1FN**, obligando a crear una tabla aparte.

---

## 2. Observaciones

- **Sin grupos repetitivos:** ninguna tabla almacena listas dentro de una columna (p. ej., varios teléfonos o varias opciones separadas por comas).
- **Sin atributos compuestos almacenados:** `Usuario.nombre_completo` **no** se almacena (se compone de `nombres` + `apellidos`). El `marcador` de un evento vive como `marcador_local` y `marcador_visitante` en Resultado, no como un valor compuesto.
- **Claves presentes:** todas las tablas tienen clave (PK sustituta y, donde aplica, CK natural), por lo que cada fila es identificable.
- **Cumplimiento de la regla académica:** cada dato queda en su propio atributo y cada tabla representa un solo conjunto de hechos.

---

## 3. Veredicto 1FN

**Las 29 tablas cumplen la Primera Forma Normal.**
Condición a vigilar: mantener `telefono` como valor único (o crear tabla propia si el profesor exige múltiples números).
