#!/bin/sh
set -e
cd /home/site/wwwroot

# Oryx ya extrae node_modules.tar.zst en /node_modules antes de este script.
# Solo se usa como respaldo si /node_modules no existe.
if [ ! -d /node_modules ]; then
  mkdir -p /node_modules
  unzstd -c node_modules.tar.zst | tar -xf - -C /node_modules
fi

rm -rf node_modules
ln -s /node_modules node_modules
exec node server.js
