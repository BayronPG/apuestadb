# Definición de Requisitos — ApuestaDB (Fase 1)

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García
**Estado:** borrador de Fase 1, pendiente de validación con el profesor.

> Objetivo de la fase: **definir completamente el negocio antes de diseñar la base de datos.**
> En esta fase no se generan tablas, SQL ni código.

---

## Leyenda de clasificación

| Etiqueta | Significado |
|---|---|
| **CONFIRMADO** | Indicación del profesor o decisión explícita de Jhon. |
| **PROPUESTA** | Recomendación del equipo/agente, sujeta a validación. |
| **PENDIENTE** | Falta información. |
| **DUDA** | Requiere aclaración del profesor. |

## Stack tecnológico (CONFIRMADO — decisión de Jhon, 14/sep/2026)

| Capa | Tecnología |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Base de datos | SQL Server |
| Administración de BD | SQL Server Management Studio (SSMS) |

> Nota: la validación final del profesor sobre este stack sigue como **PENDIENTE**.

---

## 1. Objetivo general

Diseñar, modelar, implementar y validar la **base de datos relacional** de un sitio web académico de **apuestas deportivas simuladas** (saldo ficticio, sin dinero real), aplicando los conceptos y buenas prácticas de **Bases de Datos 2**, garantizando integridad, trazabilidad y seguridad, y sirviendo de respaldo al frontend (React) y al backend (Node.js + Express).

## 2. Objetivos específicos

1. Definir el negocio: actores, requisitos funcionales y no funcionales, reglas de negocio y casos de uso.
2. Construir el **modelo conceptual** (entidades, atributos, relaciones, cardinalidades y diagrama E-R).
3. Derivar el **modelo lógico relacional** normalizado y su diccionario de datos.
4. Implementar el **modelo físico** en SQL Server (DDL: tablas, claves, restricciones, índices).
5. Poblar la base con **datos de prueba** y formular consultas básicas y avanzadas.
6. Integrar la base con un **backend y frontend** de demostración.
7. **Validar y documentar** el sistema (pruebas, respaldos, evidencias).

## 3. Alcance

### Incluido

- Registro e inicio de sesión de usuarios, con roles. *(CONFIRMADO)*
- Contraseñas almacenadas con **hash** (nunca en texto plano). *(CONFIRMADO)*
- Saldo ficticio **por tipos: tokens y PSE**. *(CONFIRMADO — indicación del profesor)*
- Deporte inicial: **fútbol**. *(PROPUESTA)*
- Ligas/torneos, equipos y eventos deportivos. *(PROPUESTA)*
- Mercado inicial: **resultado del partido** (local / empate / visitante). *(PROPUESTA)*
- Cuotas por opción de apuesta. *(PROPUESTA)*
- Apuestas **simples**. *(PROPUESTA)*
- Liquidación de apuestas según el resultado oficial.
- Historial de apuestas y movimientos de saldo.
- Auditoría de operaciones importantes.
- Panel administrativo básico y reportes académicos.

### Excluido (por ahora)

- Dinero real, pasarelas de pago, retiros o recargas reales. *(CONFIRMADO)*
- Apuestas combinadas o en vivo. *(PROPUESTA de alcance futuro)*
- Múltiples deportes. *(PROPUESTA de alcance futuro)*
- Cuotas provenientes de proveedores externos. *(PROPUESTA de alcance futuro)*

## 4. Estructura de la documentación

| Documento | Contenido |
|---|---|
| `actores.md` | Actores del sistema |
| `requisitos_funcionales.md` | Requisitos funcionales (RF) |
| `requisitos_no_funcionales.md` | Requisitos no funcionales (RNF) |
| `reglas_negocio.md` | Reglas de negocio (RN) |
| `casos_uso.md` | Casos de uso (CU) |
| `riesgos.md` | Riesgos (RS) |
| `informacion_pendiente.md` | Información pendiente |
