/**
 * Formato de presentacion (moneda ficticia, fechas, textos de estado).
 *
 * Toda la aplicacion muestra el saldo como moneda ficticia en pesos
 * colombianos (COP). No hay dinero real en ApuestaDB.
 */

const FORMATO_MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const FORMATO_NUMERO = new Intl.NumberFormat('es-CO');

/**
 * Formatea un valor como moneda ficticia.
 * @param {number|string|null|undefined} valor
 */
export function moneda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return FORMATO_MONEDA.format(numero);
}

/** Formatea un numero entero/decimal con separadores de miles. */
export function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? FORMATO_NUMERO.format(n) : '—';
}

function aFecha(valor) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Fecha corta: 14/09/2026 */
export function fecha(valor) {
  const f = aFecha(valor);
  return f ? f.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}

/** Fecha y hora: 14/09/2026, 6:38 p. m. */
export function fechaHora(valor) {
  const f = aFecha(valor);
  if (!f) return '—';
  return f.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Solo la hora: 6:38 p. m. */
export function hora(valor) {
  const f = aFecha(valor);
  return f ? f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—';
}

/** Convierte un valor ISO a `YYYY-MM-DDTHH:mm` para inputs datetime-local. */
export function paraInputFechaHora(valor) {
  const f = aFecha(valor);
  if (!f) return '';
  const desplazamiento = f.getTimezoneOffset() * 60000;
  return new Date(f.getTime() - desplazamiento).toISOString().slice(0, 16);
}

/** Convierte `YYYY-MM-DD` (input date) a ISO para las consultas de la API. */
export function desdeInputFecha(valor, finDelDia = false) {
  if (!valor) return null;
  const sufijo = finDelDia ? 'T23:59:59' : 'T00:00:00';
  return `${valor}${sufijo}`;
}

/** Texto legible de un estado del dominio (apuesta, evento, notificacion). */
export function textoEstado(estado) {
  const mapa = {
    pendiente: 'Pendiente',
    ganada: 'Ganada',
    perdida: 'Perdida',
    anulada: 'Anulada',
    programado: 'Programado',
    en_curso: 'En curso',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    abierto: 'Abierto',
    cerrado: 'Cerrado',
    habilitada: 'Habilitada',
    deshabilitada: 'Deshabilitada',
    oficial: 'Oficial',
    provisional: 'Provisional',
    activo: 'Activo',
    inactivo: 'Inactivo',
    suspendido: 'Suspendido',
    no_leida: 'No leida',
    leida: 'Leida',
    aplicada: 'Aplicada',
    exito: 'Exito',
    fallo: 'Fallo',
    debito: 'Debito',
    credito: 'Credito',
  };
  if (!estado) return '—';
  return mapa[String(estado)] || String(estado);
}

/** Variante de Badge adecuada para cada estado. */
export function tipoBadgeEstado(estado) {
  const mapa = {
    pendiente: 'advertencia',
    ganada: 'exito',
    perdida: 'error',
    anulada: 'neutro',
    programado: 'info',
    en_curso: 'advertencia',
    finalizado: 'neutro',
    cancelado: 'error',
    activo: 'exito',
    inactivo: 'neutro',
    suspendido: 'error',
    exito: 'exito',
    fallo: 'error',
    no_leida: 'info',
    leida: 'neutro',
    abierto: 'exito',
    cerrado: 'neutro',
    oficial: 'exito',
    provisional: 'advertencia',
  };
  return mapa[String(estado)] || 'neutro';
}

/** Iniciales para el avatar (nombres + apellidos). */
export function iniciales(nombres, apellidos) {
  const a = (nombres || '').trim().charAt(0);
  const b = (apellidos || '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || 'AD';
}

/** Nombre completo legible. */
export function nombreCompleto(usuario) {
  if (!usuario) return 'Usuario';
  const partes = [usuario.nombres, usuario.apellidos].filter(Boolean);
  return partes.length ? partes.join(' ') : usuario.correo || 'Usuario';
}
