# Procedimientos almacenados — ApuestaDB (Fase 7)

**Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia) · **Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García
**Motor:** SQL Server · **Ubicación:** `database/procedures/`
**Convenciones:** prefijo `usp_`; manejo de errores con `TRY/CATCH` + `THROW` (códigos 50000+); transacciones con patrón "propia/anidada".

---

## 1. Resumen de procedimientos (14)

| # | Procedimiento | Archivo | Categoría | Transaccional |
|---|---|---|---|---|
| 1 | `usp_Usuario_Registrar` | 01_auth | Crítico | Sí |
| 2 | `usp_Auth_IniciarSesion` | 01_auth | Crítico | No |
| 3 | `usp_Auth_RecuperarContrasena` | 01_auth | Crítico | Sí |
| 4 | `usp_Saldo_Consultar` | 02_saldo | Consulta | No |
| 5 | `usp_MovimientoSaldo_Registrar` | 02_saldo | Crítico | Sí (propia o anidada) |
| 6 | `usp_Recarga_Crear` | 02_saldo | Crítico | Sí |
| 7 | `usp_Apuesta_Registrar` | 03_apuestas | Crítico | Sí |
| 8 | `usp_Apuesta_Liquidar` | 03_apuestas | Crítico | Sí |
| 9 | `usp_Apuesta_Historial` | 03_apuestas | Consulta | No |
| 10 | `usp_Evento_RegistrarResultado` | 04_eventos | Crítico | Sí |
| 11 | `usp_Notificacion_Crear` | 04_eventos | Soporte | No |
| 12 | `usp_MovimientoSaldo_Historial` | 05_reportes | Consulta | No |
| 13 | `usp_Auditoria_Registrar` | 06_auditoria | Auxiliar | No |
| 14 | `usp_Auditoria_Consultar` | 06_auditoria | Consulta | No |

> **Orden de ejecución de los archivos:** 06 (auditoría, requerido por los demás) puede ejecutarse primero; luego 01 → 05. La creación no valida dependencias (resolución diferida), pero la **ejecución** requiere que `usp_Auditoria_Registrar`, `usp_Notificacion_Crear` y `usp_MovimientoSaldo_Registrar` existan.

---

## 2. Fichas técnicas

### 1. usp_Usuario_Registrar
- **Objetivo:** registrar un usuario y crear sus cuentas de saldo en cero.
- **Parámetros:** `@nombres`, `@apellidos`, `@correo`, `@contrasena_hash` (hash calculado por el backend), `@telefono` (opc), `@id_usuario` (OUTPUT).
- **Validaciones:** campos obligatorios; formato de correo; correo y teléfono únicos; existencia del rol `usuario`.
- **Resultado esperado:** `id_usuario` + mensaje; dos cuentas `SaldoCuenta` (tokens y PSE) en 0. Regla RN-02.

### 2. usp_Auth_IniciarSesion
- **Objetivo:** validar credenciales y devolver los datos de sesión.
- **Parámetros:** `@correo`, `@contrasena_hash`, `@direccion_origen` (opc); `@id_usuario`, `@id_rol`, `@nombre_rol` (OUTPUT).
- **Validaciones:** datos presentes; usuario existente; estado `activo`; hash coincidente.
- **Resultado esperado:** datos del usuario y rol; registro de auditoría (`exito`/`fallo`).
- **Nota:** la comparación es por igualdad de hash. Si el backend usa hash con sal aleatoria (bcrypt), la verificación se hace en el backend.

### 3. usp_Auth_RecuperarContrasena
- **Objetivo:** solicitar un token de recuperación o restablecer la contraseña.
- **Parámetros:** `@accion` (`solicitar`|`restablecer`), `@correo`, `@valor_token`, `@nueva_contrasena_hash`, `@valor_token_generado` (OUTPUT).
- **Validaciones:** acción válida; usuario activo; token vigente y no expirado; nueva credencial válida.
- **Resultado esperado:** token generado (vigencia 30 min) o confirmación del restablecimiento; token marcado como `usado`.

### 4. usp_Saldo_Consultar
- **Objetivo:** consultar el saldo del usuario por tipo.
- **Parámetros:** `@id_usuario`.
- **Validaciones:** el usuario existe.
- **Resultado esperado:** filas con tipo de saldo, saldo actual y última actualización.

### 5. usp_MovimientoSaldo_Registrar
- **Objetivo:** aplicar un débito/crédito y registrar el movimiento.
- **Parámetros:** `@id_saldo_cuenta`, `@nombre_movimiento`, `@monto`, `@id_apuesta`, `@id_recarga`, `@referencia`, `@id_movimiento` (OUTPUT).
- **Validaciones:** monto > 0; origen excluyente (apuesta **o** recarga); tipo de movimiento válido; cuenta existente; saldo suficiente en débitos.
- **Resultado esperado:** movimiento registrado y `saldo_resultante`; atómico (abre transacción si no hay una activa). Reglas RN-18, RN-19.

### 6. usp_Recarga_Crear
- **Objetivo:** registrar una recarga ficticia y abonarla al saldo.
- **Parámetros:** `@id_usuario`, `@id_tipo_saldo`, `@monto`, `@id_administrador` (opc), `@observacion` (opc), `@id_recarga` (OUTPUT).
- **Validaciones:** usuario activo; tipo de saldo válido; monto > 0; administrador válido si se informa.
- **Resultado esperado:** recarga + movimiento + notificación; saldo actualizado. Reglas RN-06, RN-18.

### 7. usp_Apuesta_Registrar
- **Objetivo:** registrar una apuesta simple, congelar la cuota y descontar el saldo.
- **Parámetros:** `@id_usuario`, `@id_opcion`, `@id_tipo_saldo`, `@monto`, `@id_apuesta` (OUTPUT).
- **Validaciones:** usuario activo; opción habilitada; mercado abierto y no cerrado; evento programado y no iniciado; monto > 0; saldo suficiente.
- **Resultado esperado:** apuesta con `cuota_congelada` + débito + movimiento + auditoría, en una sola transacción. Reglas RN-03, RN-07, RN-08, RN-09, RN-10, RN-12.

### 8. usp_Apuesta_Liquidar
- **Objetivo:** liquidar una apuesta o todas las pendientes de un evento.
- **Parámetros:** `@id_apuesta` (opc), `@id_evento` (opc), `@id_administrador` (opc).
- **Validaciones:** exactamente un criterio; apuesta/evento existentes; apuesta pendiente; resultado oficial presente.
- **Resultado esperado:** liquidación por apuesta (ganada/perdida), premio abonado al mismo tipo de saldo, notificación y auditoría; devuelve la cantidad procesada. Reglas RN-04, RN-14, RN-15.
- **Nota:** la opción ganadora se **deriva** del marcador oficial (local/empate/visitante).

### 9. usp_Apuesta_Historial
- **Objetivo:** consultar el historial de apuestas de un usuario.
- **Parámetros:** `@id_usuario`, `@estado` (opc).
- **Validaciones:** el usuario existe.
- **Resultado esperado:** apuestas con evento, mercado, opción, cuota, monto y liquidación.

### 10. usp_Evento_RegistrarResultado
- **Objetivo:** registrar el resultado oficial (marcador) de un evento.
- **Parámetros:** `@id_evento`, `@marcador_local`, `@marcador_visitante`, `@estado`, `@id_administrador` (opc), `@id_resultado` (OUTPUT).
- **Validaciones:** evento existente y no cancelado; marcadores ≥ 0; un solo resultado por evento.
- **Resultado esperado:** resultado registrado; evento marcado como `finalizado` si el resultado es oficial. Regla RN-15.

### 11. usp_Notificacion_Crear
- **Objetivo:** crear una notificación para un usuario.
- **Parámetros:** `@id_usuario`, `@mensaje`, `@tipo`, `@id_notificacion` (OUTPUT).
- **Validaciones:** usuario existente; mensaje y tipo obligatorios.
- **Resultado esperado:** notificación creada en estado `no_leida`.

### 12. usp_MovimientoSaldo_Historial
- **Objetivo:** consultar el historial de movimientos de saldo de un usuario.
- **Parámetros:** `@id_usuario`, `@id_tipo_saldo` (opc), `@desde` (opc), `@hasta` (opc).
- **Validaciones:** usuario existente; rango de fechas coherente.
- **Resultado esperado:** movimientos con tipo de saldo, concepto, naturaleza, monto y saldo resultante.

### 13. usp_Auditoria_Registrar *(auxiliar)*
- **Objetivo:** insertar un registro de auditoría.
- **Parámetros:** `@operacion`, `@entidad_afectada`, `@resultado` (`exito`|`fallo`), `@id_usuario` (opc), `@descripcion` (opc), `@direccion_origen` (opc).
- **Validaciones:** operación y entidad obligatorias; resultado válido.
- **Resultado esperado:** registro insertado (sin conjunto de resultados).

### 14. usp_Auditoria_Consultar
- **Objetivo:** consultar los registros de auditoría con filtros.
- **Parámetros:** `@id_usuario`, `@operacion`, `@desde`, `@hasta`, `@top` (100 por defecto, máx. 1000).
- **Validaciones:** rango de fechas coherente.
- **Resultado esperado:** registros más recientes primero, con el correo del usuario.

---

## 3. Manejo de errores y transacciones

- **TRY/CATCH:** todos los procedimientos usan `TRY/CATCH`; los errores se propagan con `THROW` (códigos 50001–50113) y se registran en auditoría con `resultado = 'fallo'`.
- **Transacciones:** patrón "propia/anidada" — el procedimiento abre transacción **solo si** `@@TRANCOUNT = 0`, y hace `ROLLBACK` únicamente si la abrió él. `SET XACT_ABORT ON` garantiza el rollback ante error grave.
- **Atomicidad:** registrar apuesta, recarga y liquidación ejecutan inserciones + efectivo + movimiento + auditoría en **una sola transacción**.

## 4. Reglas de negocio cubiertas

| Regla | Procedimiento |
|---|---|
| RN-02 saldos iniciales en cero | usp_Usuario_Registrar |
| RN-03 un solo tipo de saldo por apuesta | usp_Apuesta_Registrar |
| RN-04 premio al mismo tipo | usp_Apuesta_Liquidar |
| RN-06 recarga de ambos tipos | usp_Recarga_Crear |
| RN-07 monto > 0 | usp_Apuesta_Registrar |
| RN-08 monto ≤ saldo | usp_Apuesta_Registrar, usp_MovimientoSaldo_Registrar |
| RN-09 evento válido | usp_Apuesta_Registrar |
| RN-10/RN-11 cuota congelada | usp_Apuesta_Registrar |
| RN-12/RN-13 atomicidad | usp_Apuesta_Registrar, usp_Recarga_Crear, usp_Apuesta_Liquidar |
| RN-14 una liquidación | usp_Apuesta_Liquidar |
| RN-15 resultado oficial | usp_Evento_RegistrarResultado, usp_Apuesta_Liquidar |
| RN-18/RN-19 movimiento y trazabilidad | usp_MovimientoSaldo_Registrar |
| RN-20 contraseña protegida | usp_Usuario_Registrar (recibe el hash) |
