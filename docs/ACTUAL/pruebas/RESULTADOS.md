# RESULTADOS.md — Fase 12 (Pruebas integrales reales)

**Fecha de ejecución:** 14/sep/2026, 19:14–19:35 (America/Bogota)
**Autorizado por:** Jhon Bayron Peláez Guerra
**Veredicto global:** ✅ **sistema validado de punta a punta a nivel de contrato (SQL Server → API → frontend)**; queda pendiente el recorrido clicable en navegador (ver §7).

---

## 1. Entorno real de ejecución

| Elemento | Valor verificado |
|---|---|
| Instancia SQL Server | `PC-BAYRON\SQLEXPRESS01` (servicio `MSSQL$SQLEXPRESS01`, Running, escucha en 1433 y en puerto dinámico) |
| Autenticación de administración | Windows (`sqlcmd -E`, sysadmin) |
| Autenticación de la API | Login SQL dedicado `apuestadb_app` (db_datareader + db_datawriter + EXECUTE en `dbo`) |
| Base de datos | `ApuestaDB` creada desde cero (no existía) |
| Backend | Node.js v24.18.0 + Express, `http://localhost:4000/api` |
| Frontend | React 18 + Vite 5, `http://localhost:5173` (proxy `/api` → 4000) |
| Respaldo | `docs/base_datos/backups/ApuestaDB_bak_fase12_20260914_191607.bak` (4.97 MB) |

## 2. Base de datos: scripts ejecutados

Orden real: `01_database` → `02_tables` → `03_constraints` → `04_indexes` → `05_seed_data` → `functions/` → `views/` → `procedures/` → `triggers/` → `docs/ACTUAL/pruebas/datos_prueba.sql`.

Objetos verificados en el motor (consulta a catálogos del sistema):

| Objeto | Esperado | Encontrado |
|---|---|---|
| Tablas | 29 | **29** ✅ |
| Claves foráneas | 38 | **38** ✅ |
| Restricciones UNIQUE | 26 | **26** ✅ |
| Índices non-clustered (+1 filtrado) | 25 + 1 | **25 + 1** ✅ |
| Vistas | 12 | **12** ✅ |
| Funciones | 6 | **6** (4 escalares + 2 table-valued) ✅ |
| Procedimientos | 14 | **14** ✅ |
| Triggers | 13 | **13** ✅ |

Datos de arranque (roles 2, deporte 1, tipos de saldo 2, tipos de movimiento 4) y datos de prueba (2 usuarios, 2 equipos, 1 evento, 1 mercado con 3 opciones) cargados correctamente.

## 3. Pruebas de API: 38 verificaciones, 0 fallas

Archivo crudo: `.tmp/resultados_fase12.txt` (no versionado).

| Grupo | Verificaciones | Resultado |
|---|---|---|
| Públicos (`/health`, login, recuperación) | 6 | ✅ 6/6 |
| Seguridad (401 sin token, 401 token inválido, 403 rol insuficiente) | 4 | ✅ 4/4 |
| Lectura de usuario (saldo, movimientos, apuestas, notificaciones, eventos, opciones, 404 de evento inexistente) | 9 | ✅ 9/9 |
| Flujo funcional completo (recarga → apuesta → resultado → liquidación) | 12 | ✅ 12/12 |
| Administrativos (usuarios, auditoría, 3 reportes, finalizados) | 6 | ✅ 6/6 |
| **Total** | **38** | ✅ **38 OK / 0 FALLAS** |

Casos negativos comprobados: login con contraseña incorrecta (401), petición sin token (401), token malformado (401), rol usuario en endpoint administrativo (403), monto 0 (400), saldo insuficiente (rechazado), liquidación sin criterio (400), evento inexistente (404).

## 4. Flujo funcional verificado con datos reales

| Paso | Operación | Resultado en la base/API |
|---|---|---|
| 1 | `POST /recargas` admin → usuario, 100.000 tokens | `id_recarga = 1` |
| 2 | `GET /saldo` usuario | **100.000** tokens |
| 3 | `POST /apuestas` 10.000 a `local` (cuota 1.85) | `id_apuesta = 1` |
| 4 | `GET /saldo` usuario | **90.000** tokens (descuento correcto) |
| 5 | `POST /eventos/1/resultado` 2-1 `oficial` | `id_resultado = 1`, evento `finalizado` |
| 6 | `POST /liquidaciones` por evento | **1** apuesta liquidada |
| 7 | `GET /apuestas/ganadas` | **1** apuesta ganada (premio 18.500 = 10.000 × 1.85) |
| 8 | `GET /saldo` usuario | **108.500** tokens |
| 9 | `GET /saldo/movimientos` | **3** movimientos (recarga crédito, apuesta débito, premio crédito) |
| 10 | `GET /notificaciones` | **2** notificaciones generadas por el flujo |
| 11 | `GET /auditoria?top=20` | 20 registros (registro, login, recarga, apuesta, resultado, liquidación) |

Esto demuestra las reglas de negocio clave: descuento de saldo en la misma transacción de la apuesta, cuota congelada, liquidación única y trazabilidad de todo movimiento.

## 5. Frontend

| Verificación | Resultado |
|---|---|
| Compilación de producción (`npm run build`) | ✅ 143 módulos, 0 errores (fase 11) |
| Servidor de desarrollo (`npm run dev`) | ✅ escucha en 5173 |
| Respuesta HTTP del SPA | ✅ 200 con contenedor `#root` |
| Integración del proxy con la API | ✅ `GET http://localhost:5173/api/health` → `baseDatos.estado = conectada` |
| Cobertura de endpoints de los servicios | ✅ 24/24 (fase 11) |

La cadena **React → API → SQL Server** queda verificada a nivel de contrato: el frontend consume `/api`, Vite lo reenvía al backend y el backend responde con datos reales de SQL Server.

## 6. Estado de los datos al terminar

- 2 usuarios: `admin@apuestadb.local` (administrador) y `usuario@apuestadb.local` (usuario).
- 1 evento del "Clasico paisa" finalizado 2-1 con su mercado y 3 opciones.
- 1 apuesta ganada liquidada, 3 movimientos de saldo, 2 notificaciones.
- Credenciales de prueba en archivo **no versionado**: `.tmp/credenciales_prueba_fase12.env`.

## 7. NO verificado (declaración honesta)

1. **Recorrido clicable en navegador**: la herramienta de navegación quedó bloqueada por política (`browser navigation blocked by policy`), así que **no** se hizo login ni navegación real por las pantallas. La integración se validó por HTTP + proxy + contratos.
2. **Responsive y accesibilidad reales**: no se probaron en dispositivos ni con herramienta de accesibilidad.
3. **Concurrencia**: no se probaron dos apuestas simultáneas sobre el mismo saldo.
4. Los scripts se ejecutaron con `sqlcmd`; no se repitió la ejecución desde SSMS.

## 8. Reproducción

```powershell
sqlcmd -S localhost\SQLEXPRESS01 -E -b -I -f 65001 -i database\01_database.sql
# ... 02 a 05, luego functions, views, procedures, triggers
sqlcmd -S localhost\SQLEXPRESS01 -E -I -b -f 65001 -i docs\pruebas\datos_prueba.sql
cd backend ; npm install ; npm start      # con backend\.env configurado
cd frontend ; npm install ; npm run dev
```
