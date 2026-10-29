/**
 * Paginacion numerica con informacion del rango visible.
 *
 * Props:
 *   - pagina        : number  Pagina actual (1..totalPaginas)
 *   - totalPaginas  : number
 *   - onCambiar     : (pagina:number) => void
 *   - total         : number  Total de elementos.
 *   - desde / hasta  : number  Rango visible (opcional; se calcula si no se envia).
 *
 * Ejemplo:
 *   const p = usePaginacion(movimientos, 10);
 *   <Pagination pagina={p.pagina} totalPaginas={p.totalPaginas} onCambiar={p.cambiarPagina}
 *               total={p.total} desde={p.desde} hasta={p.hasta} />
 */
export default function Pagination({
  pagina = 1,
  totalPaginas = 1,
  onCambiar = () => {},
  total = 0,
  desde,
  hasta,
}) {
  if (totalPaginas <= 1) {
    return (
      <div className="paginacion">
        <span>
          {total === 0 ? 'Sin registros' : `${total} registro${total === 1 ? '' : 's'}`}
        </span>
      </div>
    );
  }

  const inicio = desde ?? (pagina - 1) * 10 + 1;
  const fin = hasta ?? Math.min(pagina * 10, total);

  const ventana = 2;
  const paginas = [];
  for (let n = 1; n <= totalPaginas; n += 1) {
    if (n === 1 || n === totalPaginas || (n >= pagina - ventana && n <= pagina + ventana)) {
      paginas.push(n);
    }
  }

  return (
    <div className="paginacion">
      <span>
        Mostrando {inicio}-{fin} de {total}
      </span>

      <div className="paginacion__botones">
        <button
          type="button"
          className="paginacion__boton"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
        >
          ‹ Anterior
        </button>

        {paginas.map((n, indice) => {
          const anterior = paginas[indice - 1];
          const salto = anterior && n - anterior > 1;
          return (
            <span key={n} className="fila" style={{ gap: 4 }}>
              {salto && <span className="texto-suave">…</span>}
              <button
                type="button"
                className={`paginacion__boton ${n === pagina ? 'paginacion__boton--activo' : ''}`.trim()}
                onClick={() => onCambiar(n)}
                aria-current={n === pagina ? 'page' : undefined}
              >
                {n}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          className="paginacion__boton"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Siguiente ›
        </button>
      </div>
    </div>
  );
}
