# Entidades del negocio — ApuestaDB (Modelo Conceptual · Fase 2)

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Fuente exclusiva:** Fase 1 (`docs/ACTUAL/requisitos/`: RF, RNF, RN, CU, actores).
**Nivel:** conceptual. **No** se definen tablas, claves, tipos de datos ni motor.

> Este documento responde a la tarea 1 y 2: identificar todas las entidades del negocio y describir, para cada una, **nombre, descripción, justificación y responsabilidad**.
> Clasificación: **CONFIRMADO** (deriva de requisito confirmado) / **PROPUESTA** (entidad de apoyo derivada del dominio, sujeta a validación).

---

## Resumen por dominio

| Dominio | Entidades |
|---|---|
| 1. Seguridad y usuarios | Rol, Usuario, PreguntaSeguridad, RespuestaSeguridad, TokenRecuperacion |
| 2. Catálogo deportivo | Pais, Ciudad, Estadio, Deporte, Liga, Temporada, Equipo, Arbitro, Evento, CalendarioArbitro, Mercado, OpcionApuesta, HistorialCuota |
| 3. Apuestas | Apuesta, FavoritoEquipo |
| 4. Saldo ficticio | TipoSaldo, SaldoCuenta, MovimientoSaldo, TipoMovimientoSaldo, Recarga |
| 5. Resultados y liquidación | Resultado, Liquidacion |
| 6. Auditoría y soporte | Notificacion, Auditoria |

**Total: 29 entidades.**

---

## Dominio 1 — Seguridad y usuarios

### E-01 · Rol
- **Tipo:** Entidad fuerte (de referencia).
- **Descripción:** categoría de acceso que determina qué puede hacer un usuario (p. ej. `usuario`, `administrador`).
- **Justificación:** RF-04, RNF-02 (control de acceso por roles), CU-02/CU-09..12.
- **Responsabilidad:** agrupar el conjunto de permisos funcionales del sistema y clasificar a cada usuario.
- **Clasificación:** CONFIRMADO

### E-02 · Usuario
- **Tipo:** Entidad fuerte.
- **Descripción:** persona registrada en el sitio; puede actuar como apostador o como administrador según su rol.
- **Justificación:** RF-01..RF-06, RN-20, CU-01/CU-02/CU-04..06.
- **Responsabilidad:** representar la identidad, las credenciales y el estado de una persona dentro del sistema.
- **Clasificación:** CONFIRMADO

### E-03 · PreguntaSeguridad
- **Tipo:** Entidad fuerte (de referencia).
- **Descripción:** catálogo de preguntas usadas para verificar la identidad del usuario.
- **Justificación:** RF-05 (recuperación de contraseña mediante mecanismo seguro).
- **Responsabilidad:** ofrecer las preguntas válidas para el proceso de recuperación.
- **Clasificación:** PROPUESTA

### E-04 · RespuestaSeguridad
- **Tipo:** Entidad asociativa (Usuario ↔ PreguntaSeguridad), dependiente de Usuario.
- **Descripción:** respuesta que un usuario configura para una pregunta de seguridad.
- **Justificación:** RF-05, CU-01/CU-02.
- **Responsabilidad:** almacenar (de forma protegida) la respuesta que permite verificar al usuario.
- **Clasificación:** PROPUESTA

### E-05 · TokenRecuperacion
- **Tipo:** Entidad débil (depende de Usuario).
- **Descripción:** credencial temporal emitida para restablecer la contraseña.
- **Justificación:** RF-05.
- **Responsabilidad:** controlar la vigencia y el uso único del proceso de restablecimiento.
- **Clasificación:** PROPUESTA

---

## Dominio 2 — Catálogo deportivo

### E-06 · Pais
- **Tipo:** Entidad fuerte (de referencia).
- **Descripción:** país al que pertenecen ciudades, equipos y sedes.
- **Justificación:** entidad de apoyo del catálogo deportivo (RF-08..RF-10); PROPUESTA de alcance futuro.
- **Responsabilidad:** normalizar el origen geográfico de ciudades y equipos.
- **Clasificación:** PROPUESTA

### E-07 · Ciudad
- **Tipo:** Entidad fuerte (depende de Pais).
- **Descripción:** ciudad donde se ubican equipos y estadios.
- **Justificación:** entidad de apoyo de equipos y sedes (RF-09, RF-10).
- **Responsabilidad:** ubicar geográficamente equipos y escenarios.
- **Clasificación:** PROPUESTA

### E-08 · Estadio
- **Tipo:** Entidad fuerte (depende de Ciudad).
- **Descripción:** escenario donde se disputa un evento deportivo.
- **Justificación:** entidad de apoyo de RF-10 (eventos con sede).
- **Responsabilidad:** identificar el lugar físico del evento.
- **Clasificación:** PROPUESTA

### E-09 · Deporte
- **Tipo:** Entidad fuerte.
- **Descripción:** disciplina deportiva sobre la que se compite y se apuesta (inicial: fútbol).
- **Justificación:** RF-07, CU-03.
- **Responsabilidad:** clasificar ligas y equipos por disciplina.
- **Clasificación:** PROPUESTA (fútbol como único deporte del alcance mínimo)

### E-10 · Liga
- **Tipo:** Entidad fuerte (depende de Deporte).
- **Descripción:** torneo o competición que agrupa equipos y eventos (p. ej. una liga profesional).
- **Justificación:** RF-08, CU-03.
- **Responsabilidad:** organizar la competencia a la que pertenecen los eventos.
- **Clasificación:** PROPUESTA

### E-11 · Temporada
- **Tipo:** Entidad fuerte (depende de Liga).
- **Descripción:** período (p. ej. año o semestre) en que se disputa una liga.
- **Justificación:** entidad de apoyo de RF-10 (eventos programados por temporada).
- **Responsabilidad:** delimitar temporalmente la programación de los eventos de una liga.
- **Clasificación:** PROPUESTA

### E-12 · Equipo
- **Tipo:** Entidad fuerte (depende de Deporte y Ciudad).
- **Descripción:** club o selección que participa en los eventos.
- **Justificación:** RF-09, RN-16 (un equipo no juega contra sí mismo), CU-03.
- **Responsabilidad:** identificar a los contendientes de un evento.
- **Clasificación:** PROPUESTA

### E-13 · Arbitro
- **Tipo:** Entidad fuerte.
- **Descripción:** persona que dirige oficialmente un evento deportivo.
- **Justificación:** entidad de apoyo de la programación oficial de eventos (RF-10).
- **Responsabilidad:** registrar quién dirige cada encuentro.
- **Clasificación:** PROPUESTA

### E-14 · Evento
- **Tipo:** Entidad fuerte.
- **Descripción:** encuentro deportivo entre dos equipos, en una fecha y sede, con un estado (programado, en curso, finalizado, cancelado, suspendido).
- **Justificación:** RF-10, RF-14, RN-09, RN-16, CU-03/CU-04/CU-07.
- **Responsabilidad:** ser el objeto central sobre el que se ofrecen mercados y se realizan apuestas.
- **Clasificación:** CONFIRMADO

### E-15 · CalendarioArbitro
- **Tipo:** Entidad asociativa (Evento ↔ Arbitro).
- **Descripción:** asignación de uno o varios árbitros a un evento, con su rol en el encuentro.
- **Justificación:** entidad de apoyo de RF-10 (conformación oficial del evento).
- **Responsabilidad:** resolver la relación de muchos a muchos entre eventos y árbitros.
- **Clasificación:** PROPUESTA

### E-16 · Mercado
- **Tipo:** Entidad fuerte (depende de Evento).
- **Descripción:** tipo de apuesta ofrecido sobre un evento (inicial: "resultado del partido").
- **Justificación:** RF-11, CU-03/CU-04.
- **Responsabilidad:** agrupar las opciones sobre las que el usuario puede apostar.
- **Clasificación:** PROPUESTA

### E-17 · OpcionApuesta
- **Tipo:** Entidad fuerte (depende de Mercado).
- **Descripción:** alternativa concreta dentro de un mercado (local, empate, visitante) con su cuota vigente.
- **Justificación:** RF-12, RF-15, RN-10/RN-11, CU-03/CU-04.
- **Responsabilidad:** representar el resultado posible sobre el que se apuesta y la cuota ofrecida.
- **Clasificación:** PROPUESTA

### E-18 · HistorialCuota
- **Tipo:** Entidad débil (depende de OpcionApuesta).
- **Descripción:** registro de los cambios de cuota de una opción a lo largo del tiempo.
- **Justificación:** RN-10/RN-11 (la cuota cambia y la apuesta congela la aceptada).
- **Responsabilidad:** conservar la evolución de la cuota y permitir auditar el valor ofrecido.
- **Clasificación:** PROPUESTA

---

## Dominio 3 — Apuestas

### E-19 · Apuesta
- **Tipo:** Entidad fuerte.
- **Descripción:** registro de la apuesta simple de un usuario sobre una opción, con el monto y la cuota congelada.
- **Justificación:** RF-13..RF-18, RN-07..RN-15, CU-04/CU-06.
- **Responsabilidad:** documentar la intención de apuesta, el valor comprometido y su estado.
- **Clasificación:** CONFIRMADO

### E-20 · FavoritoEquipo
- **Tipo:** Entidad asociativa (Usuario ↔ Equipo).
- **Descripción:** equipo que un usuario marca como favorito.
- **Justificación:** entidad de apoyo de la experiencia del usuario (RF-06, perfil).
- **Responsabilidad:** resolver la relación de muchos a muchos entre usuarios y equipos.
- **Clasificación:** PROPUESTA

---

## Dominio 4 — Saldo ficticio

### E-21 · TipoSaldo
- **Tipo:** Entidad fuerte (de referencia).
- **Descripción:** clase de saldo ficticio: `tokens` y `PSE`.
- **Justificación:** RF-19, RN-01..RN-06.
- **Responsabilidad:** tipificar el saldo y las reglas de uso/no conversión.
- **Clasificación:** CONFIRMADO

### E-22 · SaldoCuenta
- **Tipo:** Entidad asociativa (Usuario ↔ TipoSaldo).
- **Descripción:** saldo disponible de un usuario para un tipo de saldo determinado.
- **Justificación:** RF-19/RF-20, RN-02, RN-08, CU-05.
- **Responsabilidad:** mantener el valor disponible actual por tipo y servir de base a las validaciones de apuesta.
- **Clasificación:** CONFIRMADO

### E-23 · MovimientoSaldo
- **Tipo:** Entidad débil (depende de SaldoCuenta).
- **Descripción:** cada débito o crédito aplicado a un saldo (apuesta, premio, recarga, ajuste).
- **Justificación:** RF-22, RN-18/RN-19, CU-05/CU-11.
- **Responsabilidad:** dejar trazabilidad completa de toda variación del saldo.
- **Clasificación:** CONFIRMADO

### E-24 · TipoMovimientoSaldo
- **Tipo:** Entidad fuerte (de referencia).
- **Descripción:** catálogo de conceptos de movimiento (apuesta, premio, recarga, ajuste).
- **Justificación:** RF-22, RN-18 (clasificar el motivo de cada movimiento).
- **Responsabilidad:** normalizar y clasificar los movimientos de saldo.
- **Clasificación:** PROPUESTA

### E-25 · Recarga
- **Tipo:** Entidad fuerte.
- **Descripción:** ingreso de saldo ficticio realizado por el administrador a favor de un usuario, en un tipo de saldo.
- **Justificación:** RF-21, RN-06, CU-11.
- **Responsabilidad:** documentar el origen y el sustento de un incremento de saldo.
- **Clasificación:** CONFIRMADO

---

## Dominio 5 — Resultados y liquidación

### E-26 · Resultado
- **Tipo:** Entidad fuerte (depende de Evento).
- **Descripción:** resultado oficial de un evento: opción ganadora y marcador.
- **Justificación:** RF-23, RN-15, CU-07.
- **Responsabilidad:** ser la fuente de verdad para liquidar las apuestas del evento.
- **Clasificación:** CONFIRMADO

### E-27 · Liquidacion
- **Tipo:** Entidad asociativa/dependiente (Apuesta ↔ Resultado).
- **Descripción:** cierre de una apuesta según el resultado: ganada, perdida o anulada, con el premio correspondiente.
- **Justificación:** RF-24, RF-25, RN-14/RN-15, CU-08.
- **Responsabilidad:** marcar la apuesta como resuelta una única vez y registrar el premio.
- **Clasificación:** CONFIRMADO

---

## Dominio 6 — Auditoría y soporte

### E-28 · Notificacion
- **Tipo:** Entidad débil (depende de Usuario).
- **Descripción:** aviso dirigido a un usuario sobre un hecho relevante (apuesta liquidada, recarga, resultado).
- **Justificación:** RNF-06 (trazabilidad y comunicación de eventos), CU-08.
- **Responsabilidad:** informar al usuario de cambios que afectan su cuenta o sus apuestas.
- **Clasificación:** PROPUESTA

### E-29 · Auditoria
- **Tipo:** Entidad fuerte.
- **Descripción:** registro de las operaciones importantes del sistema (accesos, apuestas, liquidaciones, cambios administrativos).
- **Justificación:** RF-29, RNF-06, CU-12.
- **Responsabilidad:** conservar la trazabilidad de quién hizo qué y cuándo.
- **Clasificación:** CONFIRMADO

---

## Resumen de entidades por tipo

| Tipo | Entidades |
|---|---|
| **Fuertes** | Rol, Usuario, PreguntaSeguridad, Pais, Ciudad, Estadio, Deporte, Liga, Temporada, Equipo, Arbitro, Evento, Mercado, OpcionApuesta, Apuesta, TipoSaldo, Recarga, TipoMovimientoSaldo, Resultado, Auditoria |
| **Débiles** | TokenRecuperacion, HistorialCuota, MovimientoSaldo, Notificacion |
| **Asociativas** | RespuestaSeguridad, CalendarioArbitro, FavoritoEquipo, SaldoCuenta, Liquidacion |
