'use strict';

/**
 * Actualiza una variable en un archivo .env de forma atomica.
 * - No imprime valores.
 * - Restringe permisos al propietario cuando el sistema lo permite.
 */

const fs = require('fs');
const path = require('path');

function actualizarVariable(rutaArchivo, clave, valor) {
  const ruta = path.resolve(rutaArchivo);
  const existente = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
  const lineas = existente.split(/\r?\n/);
  const indice = lineas.findIndex((linea) => linea.startsWith(`${clave}=`));

  if (indice >= 0) {
    lineas[indice] = `${clave}=${valor}`;
  } else {
    if (lineas.length > 0 && lineas[lineas.length - 1] === '') lineas.pop();
    lineas.push(`${clave}=${valor}`, '');
  }

  const temporal = `${ruta}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, lineas.join('\n'), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporal, ruta);
  try {
    fs.chmodSync(ruta, 0o600);
  } catch (_error) {
    /* en Windows puede no aplicar; no es fatal */
  }
}

module.exports = { actualizarVariable };
