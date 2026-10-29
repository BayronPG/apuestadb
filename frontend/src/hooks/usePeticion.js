import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizarError } from '../utils/errores.js';

/**
 * Hook generico para ejecutar una peticion a la API y manejar sus estados.
 *
 * @param {(arg?: any) => Promise<any>} peticion Funcion que devuelve una promesa.
 * @param {Array} dependencias Dependencias que disparan la peticion.
 * @param {{inmediato?: boolean}} opciones `inmediato: false` evita la carga inicial.
 * @returns {{datos, cargando, error, recargar, ejecutar}}
 */
export function usePeticion(peticion, dependencias = [], opciones = {}) {
  const { inmediato = true } = opciones;
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(Boolean(inmediato));
  const [error, setError] = useState(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const ejecutar = useCallback(
    async (argumento) => {
      setCargando(true);
      setError(null);
      try {
        const resultado = await peticion(argumento);
        if (montado.current) setDatos(resultado);
        return resultado;
      } catch (excepcion) {
        if (montado.current) setError(normalizarError(excepcion));
        return null;
      } finally {
        if (montado.current) setCargando(false);
      }
    },
    // `peticion` se recrea en cada render del consumidor: las dependencias
    // reales las declara quien invoca el hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencias,
  );

  useEffect(() => {
    if (inmediato) ejecutar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejecutar, inmediato]);

  return { datos, cargando, error, recargar: ejecutar, ejecutar };
}

export default usePeticion;
