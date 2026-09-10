/**
 * Genera el diagrama ER (mermaid) desde la base de datos real ApuestaDB.
 *
 * - Lee tablas, columnas y claves foraneas de SQL Server.
 * - Escribe docs/base_datos/diagramas_er/apuestadb_er.mmd (sintaxis mermaid valida).
 * - El PNG se genera luego con mermaid-cli:
 *     npx @mermaid-js/mermaid-cli -i apuestadb_er.mmd -o apuestadb_er.png -b white -s 2
 *
 * Uso (desde app/backend):  node scripts/generar_diagrama_er.mjs
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sql from 'mssql'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SALIDA = path.resolve(__dirname, '../../../docs/base_datos/diagramas_er/apuestadb_er.mmd')

// Tipos SQL -> tipo simple (mermaid no admite parentesis en el tipo)
function tipoSimple(t) {
  const s = String(t).toLowerCase()
  if (s.includes('int')) return 'int'
  if (s.includes('decimal') || s.includes('numeric') || s.includes('money')) return 'decimal'
  if (s.includes('date') || s.includes('time')) return 'date'
  if (s.includes('bit')) return 'bool'
  if (s.includes('char') || s.includes('text')) return 'string'
  if (s.includes('float') || s.includes('real')) return 'float'
  return 'string'
}

const config = {
  server: (process.env.DB_SERVER ?? 'localhost').trim(),
  port: Number(process.env.DB_PORT ?? 1433),
  database: process.env.DB_NAME ?? 'ApuestaDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 15000,
}

const pool = await new sql.ConnectionPool(config).connect()

// 1) Columnas por tabla (con PK/FK/UK)
const cols = await pool.request().query(`
  SELECT t.name AS tabla, c.name AS columna, ty.name AS tipo, c.is_nullable AS nulo,
         CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS es_pk,
         CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS es_fk,
         CASE WHEN uq.column_id IS NOT NULL THEN 1 ELSE 0 END AS es_uk
  FROM sys.tables t
  JOIN sys.columns c ON c.object_id = t.object_id
  JOIN sys.types ty ON ty.user_type_id = c.user_type_id
  LEFT JOIN (SELECT ic.object_id, ic.column_id FROM sys.index_columns ic
             JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
             WHERE i.is_primary_key = 1) pk ON pk.object_id = c.object_id AND pk.column_id = c.column_id
  LEFT JOIN sys.foreign_key_columns fk ON fk.parent_object_id = c.object_id AND fk.parent_column_id = c.column_id
  LEFT JOIN (SELECT ic.object_id, ic.column_id FROM sys.index_columns ic
             JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
             WHERE i.is_unique = 1 AND i.is_primary_key = 0) uq ON uq.object_id = c.object_id AND uq.column_id = c.column_id
  WHERE t.is_ms_shipped = 0 AND t.name <> 'sysdiagrams'
  ORDER BY t.name, c.column_id`)

// 2) Relaciones (FK)
const fks = await pool.request().query(`
  SELECT OBJECT_NAME(fk.referenced_object_id) AS padre,
         OBJECT_NAME(fk.parent_object_id)     AS hija,
         COL_NAME(fk.parent_object_id, fkc.parent_column_id) AS columna
  FROM sys.foreign_keys fk
  JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
  WHERE OBJECT_NAME(fk.parent_object_id) <> 'sysdiagrams'
  ORDER BY padre, hija, columna`)

await pool.close()

const porTabla = new Map()
for (const r of cols.recordset) {
  if (!porTabla.has(r.tabla)) porTabla.set(r.tabla, [])
  const claves = []
  if (r.es_pk) claves.push('PK')
  if (r.es_fk) claves.push('FK')
  if (r.es_uk && !r.es_pk) claves.push('UK')
  porTabla.get(r.tabla).push({ tipo: tipoSimple(r.tipo), nombre: r.columna, claves: claves.join(', ') })
}

const lineas = ['erDiagram']
for (const [tabla, columnas] of [...porTabla.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lineas.push(`    ${tabla} {`)
  for (const c of columnas) {
    lineas.push(`        ${c.tipo} ${c.nombre}${c.claves ? ' ' + c.claves : ''}`)
  }
  lineas.push('    }')
}
for (const fk of fks.recordset) {
  lineas.push(`    ${fk.padre} ||--o{ ${fk.hija} : "${fk.columna}"`)
}

const contenido = lineas.join('\n') + '\n'
fs.mkdirSync(path.dirname(SALIDA), { recursive: true })
fs.writeFileSync(SALIDA, contenido, 'utf8')

console.log(`Diagrama generado: ${SALIDA}`)
console.log(`Tablas: ${porTabla.size} | Relaciones: ${fks.recordset.length}`)
