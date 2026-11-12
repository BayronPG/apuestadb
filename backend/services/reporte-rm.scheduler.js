'use strict';

/** Refresh programado del read model de reportes (MVP, cada 60 s). */

const config = require('../config');
const { refrescar } = require('./reporte-rm.service');

let temporizador = null;
let enCurso = false;

function iniciar() {
  if (temporizador || config.entorno === 'test') return temporizador;
  const intervalo = Number(process.env.REPORTE_RM_REFRESH_MS || 60000);

  const ejecutar = async () => {
    if (enCurso) return;
    enCurso = true;
    try {
      const resultado = await refrescar();
      if (config.entorno !== 'production') {
        console.log(`[rm] refresh: ${resultado.apuestas} apuestas, ${resultado.liquidaciones} liquidaciones`);
      }
    } catch (error) {
      console.warn('[rm] refresh fallo:', error.message);
    } finally {
      enCurso = false;
    }
  };

  ejecutar();
  temporizador = setInterval(ejecutar, intervalo);
  if (temporizador.unref) temporizador.unref();
  return temporizador;
}

module.exports = { iniciar };
