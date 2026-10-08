# Casos de uso (CU) — ApuestaDB

> Formato: actor, propósito, precondiciones, flujo principal, flujos alternativos, postcondiciones.

---

## CU-01 — Registro de usuario

- **Actor:** Visitante.
- **Propósito:** crear una cuenta para poder apostar.
- **Precondiciones:** el visitante no está autenticado.
- **Flujo principal:** 1) el visitante ingresa nombre, apellido(s), correo y contraseña; 2) el sistema valida que el correo no esté registrado; 3) el sistema guarda la contraseña con hash y asigna el rol `usuario`; 4) el sistema crea los saldos tokens y PSE en cero (RN-02); 5) el sistema muestra confirmación.
- **Flujos alternativos:** correo ya registrado → mensaje de error; datos inválidos → mensaje de error.
- **Postcondiciones:** existe un usuario con rol `usuario` y saldos iniciales en cero.

## CU-02 — Inicio de sesión

- **Actor:** Usuario / Administrador.
- **Propósito:** autenticarse para acceder a las funciones según su rol.
- **Precondiciones:** cuenta registrada.
- **Flujo principal:** 1) el usuario ingresa correo y contraseña; 2) el sistema verifica las credenciales; 3) el sistema crea la sesión y redirige según el rol; 4) el sistema registra el acceso en auditoría.
- **Flujos alternativos:** credenciales inválidas → mensaje de error.
- **Postcondiciones:** sesión activa; acceso registrado en auditoría.

## CU-03 — Consultar eventos y cuotas

- **Actor:** Visitante / Usuario.
- **Propósito:** ver eventos deportivos, mercados, opciones y cuotas disponibles.
- **Precondiciones:** eventos registrados y con mercados configurados.
- **Flujo principal:** 1) el actor consulta los eventos disponibles; 2) el sistema lista deporte, liga, equipos, fecha y estado; 3) el actor consulta las opciones y cuotas de un evento.
- **Flujos alternativos:** no hay eventos → mensaje de lista vacía.
- **Postcondiciones:** información mostrada.

## CU-04 — Realizar apuesta simple

- **Actor:** Usuario.
- **Propósito:** apostar sobre el resultado de un evento.
- **Precondiciones:** sesión activa; evento en estado válido; saldo suficiente.
- **Flujo principal:** 1) el usuario selecciona evento, mercado, opción y monto; 2) el sistema valida el estado del evento (RN-09), el monto (RN-07) y el saldo (RN-08); 3) el sistema congela la cuota (RN-10) y descuenta el saldo en la misma transacción (RN-12); 4) el sistema registra la apuesta y el movimiento de saldo; 5) el sistema confirma la apuesta.
- **Flujos alternativos:** saldo insuficiente, evento inválido o monto no válido → se rechaza sin cambios.
- **Postcondiciones:** apuesta registrada con cuota congelada; saldo descontado; movimiento generado.

## CU-05 — Consultar saldo y movimientos

- **Actor:** Usuario.
- **Propósito:** ver el saldo por tipo y el detalle de movimientos.
- **Precondiciones:** sesión activa.
- **Flujo principal:** 1) el usuario consulta su saldo; 2) el sistema muestra el saldo por tipo (tokens y PSE) y el historial de movimientos.
- **Postcondiciones:** información mostrada.

## CU-06 — Consultar historial de apuestas

- **Actor:** Usuario.
- **Propósito:** ver sus apuestas y su estado (pendiente, ganada, perdida).
- **Precondiciones:** sesión activa.
- **Flujo principal:** 1) el usuario consulta su historial; 2) el sistema lista las apuestas con evento, opción, cuota, monto y estado.
- **Postcondiciones:** información mostrada.

## CU-07 — Registrar resultado oficial

- **Actor:** Administrador.
- **Propósito:** registrar el resultado final de un evento para habilitar la liquidación.
- **Precondiciones:** sesión de administrador; evento finalizado.
- **Flujo principal:** 1) el administrador selecciona el evento; 2) el administrador registra el resultado oficial (opción ganadora); 3) el sistema valida el estado del evento; 4) el sistema guarda el resultado.
- **Flujos alternativos:** resultado ya registrado → mensaje de error.
- **Postcondiciones:** evento con resultado oficial registrado.

## CU-08 — Liquidar apuestas

- **Actor:** Administrador / Sistema.
- **Propósito:** liquidar las apuestas de un evento según el resultado.
- **Precondiciones:** resultado oficial registrado.
- **Flujo principal:** 1) el sistema identifica las apuestas del evento; 2) determina ganadoras/perdedoras según la opción; 3) abona el premio (monto × cuota) al mismo tipo de saldo (RN-04) y genera el movimiento; 4) marca cada apuesta como liquidada (una sola vez, RN-14).
- **Flujos alternativos:** apuesta ya liquidada → se omite.
- **Postcondiciones:** apuestas liquidadas; premios abonados; movimientos generados.

## CU-09 — Gestionar catálogo

- **Actor:** Administrador.
- **Propósito:** crear y mantener deportes, ligas, equipos, eventos, mercados y cuotas.
- **Precondiciones:** sesión de administrador.
- **Flujo principal:** 1) el administrador selecciona la entidad; 2) crea, consulta, modifica o desactiva; 3) el sistema valida reglas (p. ej., RN-16, RN-17).
- **Postcondiciones:** catálogo actualizado.

## CU-10 — Gestionar usuarios

- **Actor:** Administrador.
- **Propósito:** listar, habilitar/deshabilitar y cambiar el rol de los usuarios.
- **Precondiciones:** sesión de administrador.
- **Flujo principal:** 1) el administrador lista usuarios; 2) aplica el cambio (estado o rol); 3) el sistema guarda y audita.
- **Postcondiciones:** usuario actualizado.

## CU-11 — Recargar saldo

- **Actor:** Administrador.
- **Propósito:** recargar saldo ficticio (tokens o PSE) a un usuario.
- **Precondiciones:** sesión de administrador.
- **Flujo principal:** 1) el administrador selecciona el usuario y el tipo de saldo; 2) indica el monto a recargar; 3) el sistema actualiza el saldo y genera el movimiento (RN-18, RN-19).
- **Flujos alternativos:** monto no válido → se rechaza.
- **Postcondiciones:** saldo actualizado y movimiento registrado.

## CU-12 — Consultar auditoría y reportes

- **Actor:** Administrador.
- **Propósito:** revisar operaciones auditadas y generar reportes académicos.
- **Precondiciones:** sesión de administrador.
- **Flujo principal:** 1) el administrador consulta la auditoría o solicita un reporte; 2) el sistema muestra los registros o genera el reporte.
- **Postcondiciones:** información mostrada.
