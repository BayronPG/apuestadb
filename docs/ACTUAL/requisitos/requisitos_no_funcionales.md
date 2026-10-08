# Requisitos no funcionales (RNF) — ApuestaDB

| ID | Categoría | Requisito | Clasificación |
|---|---|---|---|
| RNF-01 | Seguridad | Las contraseñas deben almacenarse con **hash** (nunca en texto plano). | CONFIRMADO |
| RNF-02 | Seguridad | El acceso debe controlarse por **roles** (usuario / administrador). | CONFIRMADO |
| RNF-03 | Seguridad | Las sesiones deben expirar y protegerse contra accesos no autorizados. | PROPUESTA |
| RNF-04 | Integridad | Las operaciones de saldo y apuestas deben ejecutarse en **transacciones ACID** (todo o nada). | CONFIRMADO |
| RNF-05 | Integridad | El esquema debe garantizar **integridad referencial** (claves foráneas) y restricciones de dominio. | CONFIRMADO |
| RNF-06 | Trazabilidad | Las operaciones importantes deben quedar **auditadas** (quién, qué, cuándo). | PROPUESTA |
| RNF-07 | Rendimiento | Las consultas de uso frecuente (eventos, historial, saldo) deben responder en tiempos razonables. | PROPUESTA |
| RNF-08 | Disponibilidad | El sistema debe estar disponible durante las sesiones de trabajo y evaluación. | PROPUESTA |
| RNF-09 | Usabilidad | La interfaz debe ser **responsive** (móvil y escritorio) y de uso intuitivo. | PROPUESTA |
| RNF-10 | Mantenibilidad | El código y la documentación deben estar organizados, comentados y versionados en Git. | CONFIRMADO |
| RNF-11 | Compatibilidad | El sistema debe ejecutarse en el entorno local definido (Windows, SQL Server, Node.js). | CONFIRMADO |
| RNF-12 | Legal/Ético | El sistema es **académico y simulado**: no gestiona dinero real ni promueve apuestas reales. | CONFIRMADO |
