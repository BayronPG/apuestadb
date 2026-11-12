#!/bin/sh
set -e
cd /home/site/wwwroot

# App Service F1: /home tiene 1 GB. node_modules se extrae a /tmp (disco local)
# desde el archivo generado por Oryx para evitar ENOSPC.
if [ ! -f /tmp/node_modules/.ready ]; then
  rm -rf /tmp/node_modules
  mkdir -p /tmp/node_modules
  unzstd -c node_modules.tar.zst | tar -xf - -C /tmp/node_modules
  touch /tmp/node_modules/.ready
fi

rm -rf node_modules
ln -s /tmp/node_modules node_modules
exec node server.js
