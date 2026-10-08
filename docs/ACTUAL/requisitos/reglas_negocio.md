# Reglas de negocio (RN) — ApuestaDB

> Clasificación: **CONFIRMADO** (indicación del profesor o decisión de Jhon) / **PROPUESTA** (sujeta a validación).

## Saldo por tipos (tokens y PSE)

| ID | Regla | Clasificación |
|---|---|---|
| RN-01 | El saldo ficticio se maneja por tipos: **tokens** y **PSE**. | CONFIRMADO |
| RN-02 | Al registrarse, el usuario recibe saldo inicial **en cero** para ambos tipos. | CONFIRMADO |
| RN-03 | Una apuesta se paga con **un solo tipo** de saldo. | CONFIRMADO |
| RN-04 | El premio se abona al **mismo tipo** de saldo utilizado en la apuesta. | CONFIRMADO |
| RN-05 | No hay **conversión** entre tipos de saldo. | CONFIRMADO |
| RN-06 | Se puede **recargar** saldo de ambos tipos (tokens y PSE). | CONFIRMADO |

## Apuestas

| ID | Regla | Clasificación |
|---|---|---|
| RN-07 | Un usuario no puede apostar un monto **igual o inferior a cero**. | CONFIRMADO |
| RN-08 | Un usuario no puede apostar **más saldo del disponible** en el tipo seleccionado. | CONFIRMADO |
| RN-09 | No se puede apostar en un evento **iniciado, finalizado, cancelado o suspendido**. | CONFIRMADO |
| RN-10 | La apuesta debe guardar la **cuota aceptada** en el momento de su registro. | CONFIRMADO |
| RN-11 | Un cambio posterior en la cuota **no altera** una apuesta existente. | CONFIRMADO |
| RN-12 | El registro de la apuesta y el **descuento del saldo** se ejecutan en una misma transacción. | CONFIRMADO |
| RN-13 | Si una parte de la operación falla, **toda la operación se revierte**. | CONFIRMADO |
| RN-14 | Una apuesta no puede **liquidarse dos veces**. | CONFIRMADO |
| RN-15 | La liquidación depende del **resultado oficial** registrado en el sistema. | CONFIRMADO |

## Integridad y seguridad

| ID | Regla | Clasificación |
|---|---|---|
| RN-16 | Un equipo **no puede jugar contra sí mismo** en un evento. | CONFIRMADO |
| RN-17 | Una opción de apuesta debe pertenecer a un **mercado asociado a un evento**. | CONFIRMADO |
| RN-18 | Toda modificación del saldo debe generar un **movimiento**. | CONFIRMADO |
| RN-19 | Los movimientos financieros ficticios deben conservar **trazabilidad**. | CONFIRMADO |
| RN-20 | Las contraseñas **no deben almacenarse como texto plano**. | CONFIRMADO |
| RN-21 | Las fechas y estados deben **validarse**. | CONFIRMADO |
