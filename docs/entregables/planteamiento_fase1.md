# Planteamiento del proyecto — ApuestaDB (Fase 1)

**Fecha:** 14/sep/2026 · **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia)
**Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García

> Estado del documento: borrador de Fase 1, pendiente de validación con el profesor.
> Clasificación usada: **CONFIRMADO** (profesor o decisión explícita de Jhon), **PROPUESTA** (del equipo/agente, sujeta a validación), **PENDIENTE** (falta información).

---

## 1. Nombre del proyecto

**ApuestaDB** *(nombre provisional — PENDIENTE de confirmación)*

Sitio web académico de **apuestas deportivas simuladas**.

## 2. Descripción

Plataforma web donde los usuarios, con un saldo **ficticio**, pueden:

- Registrarse e iniciar sesión de forma segura.
- Ver eventos deportivos y sus cuotas.
- Registrar apuestas **simples** sobre el resultado de un partido (local, empate o visitante).
- Gestionar su saldo ficticio (recargas y movimientos).
- Ver el historial de sus apuestas y su liquidación.

Todo el dinero, saldo y transacciones son **simulados**: no hay dinero real ni pasarelas de pago. *(CONFIRMADO — decisión del equipo)*

## 3. Problema / necesidad

Se necesita diseñar y construir una base de datos relacional **completa y bien fundamentada** que respalde el funcionamiento de un sitio de apuestas deportivas simuladas, aplicando correctamente los conceptos de Bases de Datos 2: modelado, normalización, integridad referencial, transacciones, consultas avanzadas y auditoría.

El dominio de apuestas es ideal académicamente porque combina:

- Múltiples entidades relacionadas (usuarios, roles, deportes, ligas, equipos, eventos, mercados, cuotas, apuestas, saldo).
- Reglas de negocio exigentes (no apostar sin saldo, congelar la cuota aceptada, liquidar una sola vez, trazabilidad de movimientos).
- Requisitos de seguridad (contraseñas con hash, sesiones, roles).

## 4. Justificación

- **Aplicación real de BD2:** el proyecto obliga a aplicar de punta a punta el ciclo de vida de una base de datos (análisis → modelado → implementación → validación).
- **Dominio relacionalmente rico:** permite demostrar claves primarias/foráneas, relaciones N:M, restricciones y transacciones.
- **Simulación ética:** al usar saldo ficticio, se mantienen todos los retos técnicos de un sistema de apuestas **sin fomentar el juego con dinero real**.
- **Escalable por fases:** se puede empezar por un alcance mínimo (fútbol, apuestas simples) y ampliar después. *(PROPUESTA)*

## 5. Objetivos

### Objetivo general

Diseñar, modelar, implementar y validar la base de datos de un sitio web académico de apuestas deportivas simuladas, aplicando los conceptos y buenas prácticas de Bases de Datos 2.

### Objetivos específicos

1. Analizar y documentar los **requisitos** funcionales, no funcionales y reglas de negocio.
2. Construir el **modelo conceptual** (entidades, atributos, relaciones, cardinalidades y diagrama E-R).
3. Derivar el **modelo lógico relacional** normalizado y su diccionario de datos.
4. Implementar el **modelo físico** en SQL Server (DDL: tablas, claves, restricciones, índices).
5. Poblar la base con **datos de prueba** y formular **consultas** (básicas y avanzadas: joins, subconsultas, vistas, funciones, procedimientos, triggers, transacciones).
6. Integrar la base con un **backend y frontend** de demostración (registro/login seguro, saldo ficticio, apuestas).
7. **Validar y documentar** el sistema (pruebas, respaldos, evidencias).

## 6. Alcance

### Incluido (alcance mínimo viable — PROPUESTA, sujeto a confirmación del profesor)

- Registro e inicio de sesión de usuarios, con roles.
- Contraseñas almacenadas con **hash** (nunca en texto plano). *(CONFIRMADO — regla del proyecto)*
- Saldo ficticio **por tipos: tokens y PSE** (reglas R1–R5). *(CONFIRMADO — indicación del profesor)*
- Un deporte: **fútbol**. *(PROPUESTA)*
- Ligas, equipos, calendario de eventos.
- Un mercado: **resultado del partido** (local / empate / visitante). *(PROPUESTA)*
- Cuotas por opción.
- Apuestas **simples**.
- Liquidación de apuestas según resultado oficial.
- Historial de apuestas y movimientos de saldo.
- Auditoría de operaciones importantes.
- Panel administrativo básico y reportes académicos.

### Excluido (por ahora)

- Dinero real, pasarelas de pago, retiros o recargas reales.
- Apuestas combinadas o en vivo.
- Múltiples deportes.
- Cuotas provenientes de proveedores externos.

*(Estos puntos son PROPUESTA de alcance futuro.)*

## 7. Limitaciones

- **Académico y simulado:** no gestiona dinero real ni promueve apuestas reales.
- **Entorno local:** la base de datos corre en SQL Server local (instancia de desarrollo).
- **Alcance reducido:** se prioriza un flujo completo y correcto (fútbol, apuesta simple) sobre la cantidad de funciones.
- **Dependencia de validación del profesor:** el motor, el stack y el alcance final están pendientes de confirmación.

## 8. Validaciones pendientes (para el profesor)

1. ¿Se aprueba **SQL Server** como motor y **React** como frontend?
2. ¿El **listado de 16 tablas** trabajado en clase es la base del modelo definitivo?
3. ¿El alcance mínimo (fútbol + apuesta simple + saldo tokens/PSE) es el esperado?
4. ¿Qué entregables y formato de entrega se requieren?
