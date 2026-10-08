# Requisitos funcionales (RF) — ApuestaDB

> Prioridad: **Alta** (indispensable para el alcance mínimo) · **Media** (recomendable) · **Baja** (opcional/futuro).

## Módulo 1 — Autenticación y gestión de usuarios

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-01 | El sistema debe permitir el registro de nuevos usuarios con nombre, apellido(s), correo y contraseña. | Alta | CONFIRMADO |
| RF-02 | El sistema debe permitir el inicio de sesión con correo y contraseña. | Alta | CONFIRMADO |
| RF-03 | El sistema debe permitir el cierre de sesión. | Alta | CONFIRMADO |
| RF-04 | El sistema debe asignar un rol a cada usuario (usuario / administrador) y controlar el acceso según el rol. | Alta | CONFIRMADO |
| RF-05 | El sistema debe permitir la recuperación de contraseña mediante un mecanismo seguro (token temporal). | Media | PROPUESTA |
| RF-06 | El sistema debe permitir al usuario consultar y actualizar su perfil. | Media | PROPUESTA |

## Módulo 2 — Catálogo deportivo

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-07 | El sistema debe permitir registrar y consultar **deportes** (inicial: fútbol). | Alta | PROPUESTA |
| RF-08 | El sistema debe permitir registrar **ligas/torneos** asociadas a un deporte. | Alta | PROPUESTA |
| RF-09 | El sistema debe permitir registrar **equipos**. | Alta | PROPUESTA |
| RF-10 | El sistema debe permitir registrar **eventos deportivos** (partidos) con fecha, estado y participantes (local / visitante). | Alta | PROPUESTA |
| RF-11 | El sistema debe permitir definir **mercados de apuesta** por evento (inicial: resultado del partido). | Alta | PROPUESTA |
| RF-12 | El sistema debe permitir definir **opciones de apuesta** por mercado (local / empate / visitante) y su **cuota**. | Alta | PROPUESTA |

## Módulo 3 — Apuestas

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-13 | El sistema debe permitir al usuario realizar una **apuesta simple** seleccionando evento, mercado, opción y monto. | Alta | CONFIRMADO |
| RF-14 | El sistema debe validar que el evento esté en estado válido (no iniciado, finalizado, cancelado ni suspendido) antes de aceptar la apuesta. | Alta | CONFIRMADO |
| RF-15 | El sistema debe **congelar la cuota aceptada** en el momento de registrar la apuesta. | Alta | CONFIRMADO |
| RF-16 | El sistema debe validar el saldo disponible (del tipo seleccionado) antes de aceptar la apuesta. | Alta | CONFIRMADO |
| RF-17 | El sistema debe **descontar el monto** del saldo en la misma transacción de registro. | Alta | CONFIRMADO |
| RF-18 | El sistema debe permitir al usuario consultar el historial de sus apuestas y su estado. | Alta | CONFIRMADO |

## Módulo 4 — Saldo ficticio

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-19 | El sistema debe mantener saldo ficticio **por tipos: tokens y PSE**. | Alta | CONFIRMADO |
| RF-20 | El sistema debe permitir al usuario consultar su saldo por tipo y sus movimientos. | Alta | CONFIRMADO |
| RF-21 | El sistema debe permitir al administrador realizar **recargas** de saldo (tokens y PSE). | Alta | CONFIRMADO |
| RF-22 | El sistema debe registrar todo movimiento de saldo con trazabilidad. | Alta | CONFIRMADO |

## Módulo 5 — Resultados y liquidación

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-23 | El sistema debe permitir al administrador registrar el **resultado oficial** de un evento. | Alta | CONFIRMADO |
| RF-24 | El sistema debe **liquidar** las apuestas según el resultado (ganada / perdida) una única vez. | Alta | CONFIRMADO |
| RF-25 | El sistema debe **abonar el premio** (monto × cuota) al mismo tipo de saldo utilizado. | Alta | CONFIRMADO |

## Módulo 6 — Administración y reportes

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-26 | El sistema debe permitir al administrador gestionar el catálogo (CRUD: deportes, ligas, equipos, eventos, mercados, cuotas). | Alta | PROPUESTA |
| RF-27 | El sistema debe permitir al administrador gestionar usuarios (listar, habilitar/deshabilitar, cambiar rol). | Media | PROPUESTA |
| RF-28 | El sistema debe generar reportes académicos (apuestas por evento, usuarios, movimientos de saldo). | Media | PROPUESTA |

## Módulo 7 — Auditoría

| ID | Requisito | Prioridad | Clasificación |
|---|---|---|---|
| RF-29 | El sistema debe registrar en auditoría las operaciones importantes (inicio de sesión, apuestas, liquidaciones, cambios administrativos). | Alta | PROPUESTA |
