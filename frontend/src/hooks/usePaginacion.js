import { useMemo, useState, useEffect } from 'react';

/**
 * Paginacion en memoria de una lista ya cargada.
 *
 * @param {Array} elementos Lista completa.
 * @param {number} porPagina Tamano de pagina (por defecto 10).
 * @returns {{pagina, totalPaginas, total, desde, hasta, visibles, cambiarPagina}}
 */
export function usePaginacion(elementos, porPagina = 10) {
  const lista = Array.isArray(elementos) ? elementos : [];
  const [pagina, setPagina] = useState(1);

  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  // Si cambia el tamano de la lista (filtros, nuevas cargas), vuelve a la pagina 1.
  useEffect(() => {
    setPagina(1);
  }, [total, porPagina]);

  const visibles = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return lista.slice(inicio, inicio + porPagina);
  }, [lista, pagina, porPagina]);

  const cambiarPagina = (nueva) => {
    const destino = Math.min(Math.max(1, nueva), totalPaginas);
    setPagina(destino);
  };

  return {
    pagina,
    totalPaginas,
    total,
    porPagina,
    desde: total === 0 ? 0 : (pagina - 1) * porPagina + 1,
    hasta: Math.min(pagina * porPagina, total),
    visibles,
    cambiarPagina,
  };
}

export default usePaginacion;
