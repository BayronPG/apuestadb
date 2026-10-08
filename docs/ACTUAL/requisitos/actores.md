# Actores del sistema — ApuestaDB

> Clasificación: **CONFIRMADO** salvo indicación contraria.

| ID | Actor | Tipo | Descripción |
|---|---|---|---|
| ACT-01 | Visitante | Externo | Persona **no autenticada**. Puede consultar eventos y cuotas públicas. No puede apostar ni ver saldo. |
| ACT-02 | Usuario (apostador) | Externo | Usuario **registrado y autenticado**. Consulta eventos, realiza apuestas simples, gestiona su saldo ficticio y consulta su historial. |
| ACT-03 | Administrador | Externo (rol interno) | Usuario con rol **administrador**. Gestiona el catálogo (deportes, ligas, equipos, eventos, mercados, cuotas), los usuarios, las recargas de saldo, los resultados, la liquidación y los reportes. |
| ACT-04 | Sistema | Interno / automático | Procesos automáticos: validación de reglas, congelado de cuota, descuento/abono de saldo, liquidación por resultado, registro de auditoría y notificaciones. |

---

## Responsabilidades por actor

### ACT-01 — Visitante
- Consultar eventos deportivos y sus cuotas.
- Consultar información pública de ligas y equipos.
- Registrarse para convertirse en Usuario.

### ACT-02 — Usuario (apostador)
- Iniciar y cerrar sesión; gestionar su perfil.
- Consultar eventos, mercados, opciones y cuotas.
- Realizar apuestas simples.
- Consultar su saldo por tipo (tokens y PSE) y sus movimientos.
- Consultar el historial y el estado de sus apuestas.

### ACT-03 — Administrador
- Gestionar (crear, consultar, modificar, desactivar) deportes, ligas, equipos, eventos, mercados y cuotas.
- Gestionar usuarios (listar, habilitar/deshabilitar, cambiar rol).
- Realizar recargas de saldo ficticio (tokens y PSE).
- Registrar el resultado oficial de los eventos.
- Ejecutar/verificar la liquidación de apuestas.
- Consultar auditoría y generar reportes académicos.

### ACT-04 — Sistema
- Validar reglas de negocio al registrar una apuesta (monto, saldo, estado del evento).
- Congelar la cuota aceptada en el momento del registro.
- Descontar el monto del saldo y abonar premios dentro de una transacción.
- Liquidar apuestas según el resultado oficial (una sola vez).
- Registrar en auditoría las operaciones importantes.
