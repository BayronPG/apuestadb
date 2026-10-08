# database/consultas — Entregable de consultas SQL (Fase 13)

Colección de sentencias exigida por el profesor: **80 SELECT · 20 INSERT · 20 UPDATE · 20 DELETE · 20 JOIN**, más las **10 funciones** (6 ya existían + 4 nuevas aquí).

## Archivos

| Archivo | Contenido |
|---|---|
| `01_select.sql` | 80 SELECT distintas (S-001 … S-080). Sin JOIN: 58 sobre las 29 tablas, 12 sobre las 12 vistas, 10 de operadores avanzados. |
| `02_insert.sql` | 20 INSERT distintas (I-001 … I-020). |
| `03_update.sql` | 20 UPDATE distintas (U-001 … U-020). |
| `04_delete.sql` | 20 DELETE distintas (D-001 … D-020) + bloque de ambientación. |
| `05_join.sql` | 20 sentencias con JOIN (J-001 … J-020), contadas aparte. |
| `06_funciones_adicionales.sql` | 4 funciones nuevas hasta completar las 10. |
| `COBERTURA.md` | Mapa requisito → sentencia y decisiones de diseño. |

## Cómo se ejecuta

```bat
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\06_funciones_adicionales.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\01_select.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\02_insert.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\03_update.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\04_delete.sql
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\05_join.sql
```

También se pueden abrir y ejecutar uno por uno en SSMS (F5 sobre el archivo completo).

## Reglas importantes

1. **`02`, `03` y `04` terminan en `ROLLBACK`.** Se pueden ejecutar las veces que se quiera: la base de demostración no cambia. Para dejar los cambios de forma permanente, cambie la línea `ROLLBACK TRANSACTION` por `COMMIT TRANSACTION`.
2. **`04_delete.sql`** crea primero un escenario etiquetado `BORRADOR` (bloque de *ambientación*, no cuenta como sentencia DELETE) y luego lo elimina en orden seguro respecto a las llaves foráneas.
3. **Tablas inmutables:** el modelo prohíbe borrar `MovimientoSaldo`, `HistorialCuota`, `Liquidacion` y `SaldoCuenta` (triggers). Los scripts respetan esa regla a propósito.
4. **`06_funciones_adicionales.sql`** usa `CREATE OR ALTER`: es re-ejecutable sin errores.
5. No se modifican datos reales ni se usan credenciales: el proyecto es académico y el saldo es ficticio.

## Verificación

- `COBERTURA.md` §1 resume el conteo por categoría.
- Los encabezados de cada archivo indican qué demuestra cada sentencia.
- Antes de la sustentación conviene ejecutar los seis archivos y mostrar el conteo final de objetos:
  `SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0;` → 10 funciones.
