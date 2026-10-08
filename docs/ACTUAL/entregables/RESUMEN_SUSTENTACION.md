# RESUMEN_SUSTENTACION.md — ApuestaDB

**Uso:** guion para la exposición y demostración ante el profesor (Bases de Datos 2).
**Duración sugerida:** 15–20 minutos (10 de exposición + 5–8 de demo).

---

## 1. Elevator pitch (30 segundos)

> "ApuestaDB es una aplicación web académica de apuestas deportivas simuladas. No maneja dinero real: todo el saldo es ficticio. Lo importante no es la apuesta, sino la base de datos: 29 tablas normalizadas hasta 3FN, 12 vistas, 6 funciones, 14 procedimientos almacenados y 13 triggers que garantizan integridad, transacciones y auditoría. Sobre esa base construimos una API REST de 24 endpoints y una interfaz React que consume datos reales."

## 2. Estructura de la exposición

| Bloque | Contenido | Apoyo visual | Tiempo |
|---|---|---|---|
| 1. Problema y objetivo | Necesidad académica: demostrar BD2 con un caso realista y seguro (sin dinero real) | `docs/ACTUAL/entregables/planteamiento_fase1.md` | 1 min |
| 2. Requisitos | 29 RF, 12 RNF, 21 RN, 12 CU; actores usuario/administrador | `docs/ACTUAL/requisitos/` | 2 min |
| 3. Modelo de datos | Camino conceptual → lógico → físico; 29 entidades y 34 relaciones | `docs/ACTUAL/modelo_conceptual/`, `docs/ACTUAL/modelo_logico/`, `docs/ACTUAL/base_datos/diagramas_er/apuestadb_er.png` | 3 min |
| 4. Normalización | 1FN, 2FN, 3FN; correcciones C-1 y C-2; redundancias controladas | `docs/ACTUAL/normalizacion/` | 2 min |
| 5. Programación en el motor | Procedimientos, vistas, funciones y triggers; el trigger de cuotas y el de saldo | `docs/ACTUAL/procedimientos/`, `docs/ACTUAL/views_functions/`, `docs/ACTUAL/triggers/` | 3 min |
| 6. Arquitectura del sistema | BD → API → frontend; seguridad JWT + bcrypt + roles | `docs/ACTUAL/backend/ARQUITECTURA.md`, `docs/ACTUAL/frontend/ARQUITECTURA_FRONTEND.md` | 2 min |
| 7. Demo en vivo | Flujo completo (ver §3) | sistema en ejecución | 5–8 min |
| 8. Pruebas y resultados | 38 verificaciones, 0 fallas; errores y correcciones | `docs/ACTUAL/pruebas/RESULTADOS.md` | 2 min |
| 9. Cierre | Alcance, limitaciones honestas y aprendizajes | este documento §5 | 1 min |

## 3. Demo paso a paso (guion verificable)

Preparación: SQL Server activo, backend en `http://localhost:4000`, frontend en `http://localhost:5173`.

1. **Login del usuario de prueba** → panel con el saldo real de la base.
2. **Eventos activos** → abrir el "Clasico paisa" y mostrar el mercado, las tres opciones y sus cuotas.
3. **Crear apuesta** → 10.000 tokens a "local" (cuota 1.85); mostrar que el saldo baja a 90.000 y que la apuesta queda **pendiente** con la **cuota congelada**.
4. **Historial de apuestas y movimientos** → ver el débito registrado y su trazabilidad.
5. **Login del administrador** → registrar el resultado oficial 2-1.
6. **Liquidar** las apuestas del evento → la apuesta pasa a **ganada** con premio 18.500 y el saldo sube a **108.500**.
7. **Notificaciones, ranking, reportes y auditoría** → mostrar la evidencia generada automáticamente.
8. **Base de datos (SSMS)** → `SELECT` sobre `MovimientoSaldo`, `Auditoria` y `HistorialCuota` para cerrar el círculo: la interfaz no simula nada, todo está en SQL Server.

**Frase de cierre de la demo:** "Cada clic de la interfaz dejó filas reales en la base de datos, con transacciones, auditoría y reglas de negocio aplicadas en el motor."

## 4. Conceptos de Bases de Datos 2 demostrados

- Modelo entidad-relación y cardinalidades; transformación a modelo relacional.
- Normalización 1FN/2FN/3FN con dependencias funcionales y análisis de anomalías.
- Diccionario de datos y dominios cerrados con `CHECK`.
- Integridad referencial (PK, FK, UNIQUE, CHECK, DEFAULT) e índices (clustered, non-clustered, único filtrado).
- Programación en T-SQL: procedimientos con transacciones y manejo de errores, vistas, funciones y triggers.
- Concurrencia y atomicidad: registro de apuesta y descuento de saldo en una sola transacción.
- Auditoría y trazabilidad de operaciones y cambios.
- Seguridad: hash de contraseñas, tokens JWT y autorización por rol.
- Respaldos y recuperación (`BACKUP DATABASE` verificado).

## 5. Limitaciones declaradas (respuesta honesta y prevista)

- El recorrido clicable en navegador, el comportamiento responsive en dispositivos reales y las pruebas de concurrencia **no** se ejecutaron; están documentados en `docs/ACTUAL/pruebas/RESULTADOS.md` §7.
- El alcance es el inicial provisional (fútbol, apuesta simple, mercado resultado del partido) hasta que el profesor confirme.
- Faltan 3 endpoints de mejora no bloqueante (`docs/ACTUAL/frontend/PENDIENTES_BACKEND.md`).
- Los scripts se probaron con `sqlcmd`; no se repitió la ejecución desde SSMS.

## 6. Preguntas probables y respuestas breves

| Pregunta | Respuesta |
|---|---|
| ¿Por qué SQL Server? | Decisión del equipo (Jhon, 24/ago/2026) por el soporte de T-SQL para procedimientos, triggers y transacciones; pendiente de validación del profesor. |
| ¿Por qué las contraseñas no se guardan en texto plano? | Se calcula el hash con bcrypt **en el backend** (sal aleatoria) y solo se guarda el hash; el procedimiento recibe `@contrasena_hash`. |
| ¿Por qué el login no usa el procedimiento `usp_Auth_IniciarSesion`? | Ese procedimiento compara el hash por igualdad, incompatible con bcrypt por la sal aleatoria; el servicio usa consulta parametrizada + `bcrypt.compare` + auditoría. |
| ¿Dónde está garantizada la regla "no apostar más saldo del que hay"? | En el procedimiento de registro de apuesta, con validación, transacción y `THROW`; el frontend solo avisa, no decide. |
| ¿Qué pasa si cambia la cuota después de apostar? | Nada: la apuesta guarda la cuota congelada; el cambio queda en `HistorialCuota` por trigger. |
| ¿Cómo se evita liquidar dos veces la misma apuesta? | Validación de estado en el procedimiento de liquidación más el trigger de protección de liquidaciones. |
| ¿Qué desnormalizaciones se conservaron? | Cinco redundancias controladas, justificadas en `docs/ACTUAL/normalizacion/`. |
| ¿Cómo se probó el sistema? | Pruebas integrales reales: 38 verificaciones sobre los 24 endpoints, casos negativos incluidos, y un flujo funcional completo con saldos verificados en la base. |
