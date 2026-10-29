/**
 * Iconografia SVG del proyecto (sin librerias externas).
 *
 * Props:
 *   - nombre : clave del icono (ver TRAZOS). Si no existe, no se dibuja nada.
 *   - tamano : numero en px (por defecto 20)
 *   - titulo : texto accesible opcional (si falta, el icono es decorativo)
 *   - className : clase adicional
 *
 * Uso:
 *   <Icono nombre="saldo" tamano={22} />
 *   <Icono nombre="apuestas" titulo="Apuestas" />
 */
const TRAZOS = {
  saldo: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  apuestas: (
    <>
      <path d="M3.5 8.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4Z" />
      <path d="M9.5 6.5v11" />
    </>
  ),
  eventos: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 6M17.5 20a5.6 5.6 0 0 0-1.2-3.4" />
    </>
  ),
  premio: (
    <>
      <path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0Z" />
      <path d="M7.5 5.5H5A1.5 1.5 0 0 0 3.5 7c0 1.7 1.6 3 4 3M16.5 5.5H19A1.5 1.5 0 0 1 20.5 7c0 1.7-1.6 3-4 3" />
      <path d="M12 13v4M8.5 20h7l-.8-3h-5.4Z" />
    </>
  ),
  campana: (
    <>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.6 1.5 5 1.5 5H5s1.5-1.4 1.5-5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </>
  ),
  tendencia: (
    <>
      <path d="M3.5 17.5 9 12l3.5 3.5L20.5 7" />
      <path d="M15.5 7h5v5" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4.5 21 19.5H3Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.4-7 9-4.1-1.6-7-4.7-7-9V6Z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  rayo: <path d="M13.5 3 6 13.5h5L10.5 21 18 10.5h-5Z" />,
  ranking: (
    <>
      <path d="M4 20V11M10 20V5M16 20v-6M22 20H2" />
    </>
  ),
  reporte: (
    <>
      <path d="M6 3.5h8l4.5 4.5v12.5H6Z" />
      <path d="M13.5 3.5V8H18M9 13h6M9 16.5h6" />
    </>
  ),
  balon: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.2 15 10.5l-1.1 3.6h-3.8L9 10.5Z" />
      <path d="M12 3.5v4.7M5.6 8.9 9 10.5M4.4 15.6 10.1 14.1M9.6 20.2 10.1 14.1M14.9 20.6 13.9 14.1M19.7 15.1 13.9 14.1M18.2 8.4 15 10.5" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20.5a7 7 0 0 1 14 0" />
    </>
  ),
  flecha: <path d="M9 5.5 16 12l-7 6.5" />,
  mas: <path d="M12 5v14M5 12h14" />,
  rayas: <path d="M4 7h16M4 12h16M4 17h16" />,
  carpeta: (
    <>
      <path d="M3.5 7a2 2 0 0 1 2-2h3.4l1.8 2.2h7.8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    </>
  ),
  combo: (
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
    </>
  ),
};

export default function Icono({ nombre, tamano = 20, titulo, className = '' }) {
  const trazo = TRAZOS[nombre];
  if (!trazo) return null;

  return (
    <svg
      className={`icono ${className}`.trim()}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : 'true'}
      role={titulo ? 'img' : undefined}
      focusable="false"
    >
      {titulo && <title>{titulo}</title>}
      {trazo}
    </svg>
  );
}
