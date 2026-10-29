/**
 * Constantes del dominio compartidas por las pantallas.
 * Los valores corresponden al diccionario de datos y a los validadores del
 * backend (backend/routes/*.js); no inventar valores nuevos sin autorizacion.
 */

export const ROLES = {
  usuario: 'usuario',
  administrador: 'administrador',
};

/** Valores aceptados por `GET /api/apuestas?estado=`. */
export const ESTADOS_APUESTA = ['pendiente', 'ganada', 'perdida', 'anulada'];

/** Pestañas de historial de apuestas (incluye una opcion sin filtro). */
export const PESTANAS_APUESTA = [
  { clave: '', etiqueta: 'Todas' },
  { clave: 'pendiente', etiqueta: 'Pendientes' },
  { clave: 'ganada', etiqueta: 'Ganadas' },
  { clave: 'perdida', etiqueta: 'Perdidas' },
  { clave: 'anulada', etiqueta: 'Anuladas' },
];

/** Valores de `estado` en dbo.Notificacion. */
export const ESTADOS_NOTIFICACION = ['no_leida', 'leida'];

/** Valores aceptados por `POST /api/eventos/:id/resultado`. */
export const ESTADOS_RESULTADO = ['oficial', 'provisional'];

/** Valores aceptados por `GET /api/usuarios?estado=`. */
export const ESTADOS_USUARIO = ['activo', 'inactivo', 'suspendido'];

/** Operaciones registradas en la auditoria (usadas como filtro de ejemplo). */
export const OPERACIONES_AUDITORIA = [
  'Registrar apuesta',
  'Liquidar apuesta',
  'Registrar resultado',
  'Crear recarga',
  'INICIO_SESION',
  'Restablecer contrasena',
];

/** Limite aplicado por el frontend al pedir notificaciones. */
export const LIMITE_NOTIFICACIONES = 100;

/** Estados de mercado y de opcion que habilitan la apuesta (GET /api/eventos/:id/opciones). */
export const ESTADOS_OPERABLES = {
  mercado: 'abierto',
  opcion: 'habilitada',
  evento: 'programado',
};

/**
 * Funcionalidades que siguen esperando un endpoint de la API.
 *
 * La Fase 10.1 resolvio los dos bloqueos anteriores: el catalogo de
 * mercados/opciones/cuotas existe ahora en `GET /api/eventos/:id/opciones` y el
 * `idTipoSaldo` llega dentro de `GET /api/saldo`. Lo que queda son mejoras no
 * bloqueantes, listadas aqui y en docs/frontend/INTEGRACION_API.md.
 */
export const LIMITACIONES_API = [
  {
    id: 'notificaciones-lectura',
    necesidad: 'Marcar una notificacion como leida',
    uso: 'La bandeja /notificaciones es de solo lectura porque la API solo expone GET.',
    propuesta: 'PATCH /api/notificaciones/:id',
  },
  {
    id: 'perfil-actualizacion',
    necesidad: 'Consultar y actualizar el perfil del usuario',
    uso: '/perfil muestra los datos de la sesion (respuesta del login) porque no hay endpoint de perfil.',
    propuesta: 'GET/PUT /api/usuarios/perfil',
  },
  {
    id: 'catalogo-tipos-saldo',
    necesidad: 'Catalogo global de tipos de saldo',
    uso: 'La recarga administrativa toma los ids de tipo de saldo de las cuentas del administrador (GET /api/saldo). Con un catalogo global el selector seria completo para cualquier usuario.',
    propuesta: 'GET /api/saldo/tipos',
  },
];
