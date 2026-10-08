# Preguntas para el profesor — Validación de tablas

**Fecha:** 24/ago/2026
**Contexto:** listado de tablas trabajado en clase. ApuestaDB preparó el script borrador
(`docs/HISTORICO/base_datos/script_tablas_sqlserver_borrador.sql`, 16 tablas) y necesita validar
5 puntos antes de darlo por bueno.

---

## Las 5 preguntas (chuleta)

1. **Servicios:** ¿qué son los `Servicios`? ¿Mercados de apuesta (resultado, más/menos
   goles) o servicios de la plataforma (recarga, retiro)?

2. **Reglas:** ¿qué guarda la tabla `Reglas`? ¿Límites configurables (monto mínimo,
   máximo) o reglas de negocio del sistema (que normalmente van como restricciones)?

3. **Apuestas como oferta:** ¿`Apuestas` es el catálogo de cuotas que se ofrece por
   partido (local/empate/visitante) y `Hacer apuesta` la apuesta concreta del cliente?
   ¿O son la misma tabla?

4. **Resultado:** ¿dónde se registra el resultado final del partido? ¿Creamos una tabla
   `Resultado` (marcador + ganador) para poder liquidar las apuestas?

5. **Correo en Usuario:** ¿con qué dato inicia sesión el cliente: **correo**, **celular**
   o **número de documento**?

---

## Contexto breve para cada pregunta (por si la hacen ampliar)

### 1. Servicios
- En el script hoy es un catálogo genérico (nombre, descripción, estado).
- Si son mercados → conviene renombrarla `Mercados` (resultado del partido, más/menos goles…).
- Si no aportan al negocio → se puede quitar.

### 2. Reglas
- Las reglas de negocio (no apostar en eventos iniciados, monto > 0, saldo suficiente…)
  normalmente se implementan como **restricciones** (`CHECK`, triggers), no como datos.
- Una tabla `Reglas` solo tiene sentido si son **parámetros configurables** (monto mínimo
  de apuesta, límites por usuario).

### 3. Apuestas vs Hacer apuesta
- Propuesta: `Apuestas` = oferta (partido + mercado + opción + cuota) y
  `Hacer apuesta` = la apuesta del cliente (guarda la cuota aceptada, regla #4).
- Ventaja: la oferta se reutiliza y el historial del cliente no repite catálogo.

### 4. Resultado
- Sin resultado oficial no se puede liquidar (regla #15 del proyecto).
- Propuesta: `Resultado` con un único registro por partido (marcador local, visitante, ganador).

### 5. Correo en Usuario
- En clase no apareció `correo`; lo agregamos como supuesto para el login.
- Los atributos dados en clase fueron: nombres, apellidos, rol, tipo doc, #doc, cel,
  fecha registro, contraseña, estado.
- Si el login es con celular o documento, el correo se quita o queda opcional.

---

## Después de la clase

Registrar las respuestas en `DECISION_LOG.md` y ajustar el script si hace falta.
