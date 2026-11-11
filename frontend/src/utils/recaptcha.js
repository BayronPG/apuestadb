/**
 * reCAPTCHA v3 (opcional en build): si no hay VITE_RECAPTCHA_SITE_KEY,
 * las funciones devuelven null y el backend omite la verificación.
 *
 * Notas de robustez:
 * - No se espera el evento `load` del script: si ya estaba cargado, ese evento
 *   nunca vuelve a dispararse y la promesa quedaría pendiente. Se sondea
 *   `window.grecaptcha.execute` con un límite de tiempo.
 * - Si la carga falla, se libera la promesa cacheada para permitir reintentos.
 * - `execute` se invoca dentro de `grecaptcha.ready`, con reintentos cortos.
 */
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_ID = 'google-recaptcha-v3';
const ESPERA_MAXIMA_MS = 10000;

let cargando = null;

/** Espera a que el SDK exponga execute (o agota el tiempo). */
function esperarGrecaptcha(tiempoMaximoMs = ESPERA_MAXIMA_MS) {
  return new Promise((resolve) => {
    if (window.grecaptcha?.execute) {
      resolve(true);
      return;
    }
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      if (window.grecaptcha?.execute) {
        clearInterval(intervalo);
        resolve(true);
      } else if (Date.now() - inicio > tiempoMaximoMs) {
        clearInterval(intervalo);
        resolve(false);
      }
    }, 100);
  });
}

function cargarScript() {
  if (!SITE_KEY) return Promise.resolve(false);
  if (window.grecaptcha?.execute) return Promise.resolve(true);
  if (cargando) return cargando;

  cargando = new Promise((resolve) => {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
      script.async = true;
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
    esperarGrecaptcha().then(resolve);
  }).then((listo) => {
    if (!listo) cargando = null;
    return listo;
  });

  return cargando;
}

/**
 * Devuelve un token para la acción indicada, o null si reCAPTCHA no está
 * configurado o no fue posible obtenerlo tras los reintentos.
 */
export async function obtenerTokenRecaptcha(accion, { reintentos = 2 } = {}) {
  if (!SITE_KEY) return null;
  const listo = await cargarScript();
  if (!listo) return null;

  for (let intento = 0; intento < reintentos; intento += 1) {
    try {
      const token = await new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(SITE_KEY, { action: accion }).then(resolve).catch(reject);
        });
      });
      if (token) return token;
    } catch (_error) {
      // Reintenta: el SDK puede tardar en inicializar el cliente.
    }
    await new Promise((resolver) => setTimeout(resolver, 300));
  }
  return null;
}

export const recaptchaConfigurado = Boolean(SITE_KEY);
