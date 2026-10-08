# Auditoría del modelo — ApuestaDB (Fase 4)

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Alcance:** auditoría de normalización e integridad sobre las **29 tablas** del modelo lógico.
**Restricción:** solo auditoría; **no se modifica el modelo** ni se genera SQL, tipos de datos, índices ni triggers.

---

## 1. Metodología

1. Se analizaron las dependencias funcionales de cada tabla respecto a **todas sus claves candidatas** (`DEPENDENCIAS_FUNCIONALES.md`).
2. Se verificó cada forma normal de forma individual por tabla (1FN, 2FN, 3FN).
3. Se revisó la integridad conceptual, lógica y referencial.
4. Se evaluaron tablas innecesarias, entidades mal definidas, fusiones y divisiones.

---

## 2. Resumen de formas normales

| Forma | Resultado | Detalle |
|---|---|---|
| **1FN** | ✅ 29/29 | atributos atómicos, sin grupos repetitivos ni multivaluados |
| **2FN** | ✅ 29/29 | corregida la dependencia parcial de `MovimientoSaldo` (Fase 4.1) |
| **3FN** | ✅ 29/29 | corregida la dependencia transitiva de `Resultado`; 5 redundancias controladas documentadas |

**Fase 4.1: las correcciones C-1 y C-2 fueron aplicadas → 29/29 en 3FN.**

---

## 3. Integridad conceptual

- **Coherencia con el negocio:** las 29 tablas corresponden 1:1 con las 29 entidades aprobadas; el núcleo transaccional (Usuario → Apuesta → Opción → Mercado → Evento → Resultado → Liquidación → Movimiento → Saldo) está completo.
- **Reglas de negocio:** las 21 reglas (RN-01..RN-21) siguen representadas.
- **Sin entidades huérfanas:** toda entidad del modelo conceptual tiene su tabla.

## 4. Integridad lógica

- **Toda tabla tiene clave primaria** (sustituta) y, donde aplica, clave candidata natural.
- **Sin dependencias parciales** salvo el caso señalado de `MovimientoSaldo`.
- **Claves candidatas a validar:** `Arbitro (nombres, apellidos)` (podría no ser única) y las CK compuestas de `Evento`, `Apuesta` y `Recarga` (deben confirmarse con datos reales).
- **Sin tablas sin propósito:** cada tabla responde a al menos un RF o RN.

## 5. Integridad referencial esperada

| Aspecto | Expectativa |
|---|---|
| FK obligatorias | Rol→Usuario, Ciudad→Pais, Equipo→Deporte/Ciudad, Evento→Temporada/Equipos/Estadio, Mercado→Evento, OpcionApuesta→Mercado, Apuesta→Usuario/Opción/TipoSaldo, SaldoCuenta→Usuario/TipoSaldo, Movimiento→SaldoCuenta/TipoMovimiento, Liquidacion→Apuesta/Resultado, Recarga→Usuario/TipoSaldo |
| FK opcionales (NULL) | `MovimientoSaldo.id_apuesta` / `id_recarga` (mutuamente excluyentes), `Auditoria.id_usuario` (operaciones del sistema) |
| Sin huérfanos | ninguna fila puede referenciar una clave inexistente |
| Reglas a definir en física | qué borrados se permiten (restringir los transaccionales; no borrar en cascada apuestas/liquidaciones) |
| Unicidad | `Resultado.id_evento` y `Liquidacion.id_apuesta` únicos (1:1); pares de las asociativas únicos |

---

## 6. Tablas innecesarias, entidades mal definidas, fusiones y divisiones

- **Tablas innecesarias:** ninguna. Las 29 tienen justificación funcional o académica.
- **Entidades mal definidas:** dos atributos presentan problemas (no las entidades): `Resultado.opcion_ganadora` y `MovimientoSaldo.clase_movimiento`.
- **Fusiones posibles (opcionales, no recomendadas):** `TipoMovimientoSaldo` podría convertirse en un dominio de valores; se recomienda mantenerlo como catálogo por claridad académica.
- **Divisiones necesarias:** ninguna.
- **Tablas opcionales (PROPUESTA, no imprescindibles):** `Notificacion` y `FavoritoEquipo` podrían retirarse sin afectar el núcleo transaccional; `Arbitro`/`CalendarioArbitro` son de apoyo del catálogo.

---

## 7. ¿Las 29 tablas siguen siendo justificables?

**Sí.** Las 29 tablas son justificables: **25 son imprescindibles** para el alcance (identidad, catálogo deportivo, apuestas, saldo, resultados/liquidación, auditoría) y **4 son de apoyo** (`Notificacion`, `FavoritoEquipo`, `Arbitro`, `CalendarioArbitro`) que enriquecen el modelo sin redundar. Ninguna debe fusionarse ni eliminarse para quedar en 3FN.

---

## 8. Cambios recomendados antes del modelo físico

| # | Cambio | Motivo | Impacto |
|---|---|---|---|
| C-1 | Eliminar `MovimientoSaldo.clase_movimiento` | duplica `TipoMovimientoSaldo.naturaleza` (2FN) | 1 atributo menos |
| C-2 | Definir la fuente de verdad en `Resultado` (marcador vs `opcion_ganadora`) | dependencia transitiva (3FN) | posible 1 atributo menos o regla documentada |
| C-3 | Revisar la CK de `MovimientoSaldo` | coherencia de claves | ajuste de CK |
| C-4 | Validar la CK `Arbitro (nombres, apellidos)` | posible falta de unicidad | ajuste de CK |
| C-5 | Documentar las 5 redundancias controladas y su mantenimiento transaccional | integridad | regla de proceso |
| C-6 | Definir nulabilidad y acciones de borrado de las FK | integridad referencial | reglas para el modelo físico |

---

## 9. Respuestas finales

1. **¿El modelo cumple 3FN?** Estrictamente, **27 de 29** tablas. Con **C-1** y **C-2** aplicados, **las 29** quedan en 3FN (las 5 redundancias controladas se mantienen documentadas).
2. **¿Las 29 tablas siguen siendo justificables?** **Sí**; 25 imprescindibles y 4 de apoyo. No hay tablas innecesarias ni fusiones obligatorias.
3. **Cambios recomendados antes del modelo físico:** C-1 a C-6 de la tabla anterior (los críticos: C-1 y C-2).
4. **¿Listo para la Fase 5 — Diccionario de Datos?** **Sí.** La estructura de tablas y atributos es estable; el diccionario puede elaborarse y, en paralelo, aplicarse C-1 y C-2.

---

## 10. Fase 4.1 — Correcciones aplicadas

Las correcciones **C-1** (eliminar `MovimientoSaldo.clase_movimiento`) y **C-2** (eliminar `Resultado.opcion_ganadora`) fueron aplicadas. Las 5 redundancias controladas se mantienen documentadas. Verificación final: **1FN, 2FN y 3FN en 29/29 tablas.** Detalle en `CORRECCIONES_4_1.md`.
