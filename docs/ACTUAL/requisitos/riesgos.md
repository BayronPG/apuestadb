# Riesgos (RS) — ApuestaDB

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| RS-01 | **Validación tardía del profesor** (alcance, motor, stack, entregables). | Media | Alto | Documentar todo como PROPUESTA/PENDIENTE; no construir definitivos sin validación. |
| RS-02 | **Ambigüedad en reglas de saldo y mercados** (contenido de `Servicios`, `Reglas`, `Apuestas` vs `HacerApuesta`, `Resultado`). | Media | Alto | Listar como DUDA para el profesor y confirmar antes del modelado. |
| RS-03 | **Complejidad de la liquidación** (empates, eventos cancelados, anulación de resultados). | Media | Alto | Definir estados y reglas de liquidación explícitas (RN-09, RN-14, RN-15). |
| RS-04 | **Seguridad** (hash de contraseñas, sesiones, roles). | Baja | Alto | Aplicar hash, control de roles y sesión segura (RNF-01, RNF-02, RNF-03). |
| RS-05 | **Integridad transaccional** (descuento de saldo vs registro de apuesta). | Baja | Alto | Usar transacciones ACID (RN-12, RN-13). |
| RS-06 | **Expansión del alcance** (apuestas combinadas, en vivo, más deportes). | Media | Medio | Mantener el alcance mínimo viable y tratar lo demás como futuro. |
| RS-07 | **Entorno local** (configuración de SQL Server, conectividad del backend). | Media | Medio | Documentar el entorno y validar la conexión en la fase de implementación. |
| RS-08 | **Coordinación del equipo** (dos integrantes, trabajo en pareja). | Media | Medio | Git con ramas cortas y Pull Requests; documentación clara. |
