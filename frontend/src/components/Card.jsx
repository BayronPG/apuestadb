/**
 * Tarjeta contenedora.
 *
 * Props:
 *   - titulo      : string        (opcional)
 *   - subtitulo   : string        (opcional)
 *   - acciones    : ReactNode     Contenido alineado a la derecha de la cabecera.
 *   - pie         : ReactNode     Contenido del pie separado por una linea.
 *   - variante    : 'normal' | 'plana' | 'acento'
 *   - className   : string
 *   - children    : ReactNode
 *
 * Ejemplo:
 *   <Card titulo="Saldo por tipo" acciones={<Badge tipo="info">2 cuentas</Badge>}>
 *     <p>...</p>
 *   </Card>
 */
export default function Card({
  titulo,
  subtitulo,
  acciones,
  pie,
  variante = 'normal',
  className = '',
  children,
}) {
  const clases = ['card'];
  if (variante === 'plana') clases.push('card--plana');
  if (variante === 'acento') clases.push('card--acento');
  if (className) clases.push(className);

  const tieneCabecera = Boolean(titulo || subtitulo || acciones);

  return (
    <section className={clases.join(' ')}>
      {tieneCabecera && (
        <header className="card__cabecera">
          <div>
            {titulo && <h3>{titulo}</h3>}
            {subtitulo && <p className="card__subtitulo">{subtitulo}</p>}
          </div>
          {acciones && <div className="fila">{acciones}</div>}
        </header>
      )}

      {children}

      {pie && <div className="card__pie">{pie}</div>}
    </section>
  );
}
