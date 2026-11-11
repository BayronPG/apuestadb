/**
 * reCAPTCHA v3 (opcional en build): si no hay VITE_RECAPTCHA_SITE_KEY,
 * las funciones devuelven null y el backend omite la verificación.
 */
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_ID = 'google-recaptcha-v3';

let cargando = null;

function cargarScript() {
  if (!SITE_KEY) return Promise.resolve(false);
  if (window.grecaptcha?.execute) return Promise.resolve(true);
  if (cargando) return cargando;

  cargando = new Promise((resolve) => {
    const existente = document.getElementById(SCRIPT_ID);
    if (existente) {
      existente.addEventListener('load', () => resolve(Boolean(window.grecaptcha?.execute)));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.onload = () => resolve(Boolean(window.grecaptcha?.execute));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return cargando;
}

/** Devuelve un token para la acción indicada, o null si reCAPTCHA no está configurado. */
export async function obtenerTokenRecaptcha(accion) {
  if (!SITE_KEY) return null;
  const listo = await cargarScript();
  if (!listo) return null;
  try {
    return await new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(SITE_KEY, { action: accion }).then(resolve).catch(reject);
      });
    });
  } catch (_error) {
    return null;
  }
}

export const recaptchaConfigurado = Boolean(SITE_KEY);
