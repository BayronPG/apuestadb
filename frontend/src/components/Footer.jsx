import { useCallback } from 'react';

import { consultarSalud } from '../services/sistemaService.js';
import { usePeticion } from '../hooks/usePeticion.js';
import Badge from './Badge.jsx';
import Loader from './Loader.jsx';

/**
 * Pie de pagina. Consulta GET /api/health para mostrar el estado real de la API
 * y de la base de datos (conectada | sin_respuesta | no_disponible).
 *
 * No recibe props.
 */
export default function Footer({ variante = 'sistema' }) {
  const consultar = useCallback(() => consultarSalud(), []);
  const { datos, cargando, error } = usePeticion(consultar, [], {
    inmediato: variante !== 'usuario',
  });

  const estadoBase = datos?.baseDatos?.estado || null;
  const tipoBase =
    estadoBase === 'conectada' ? 'exito' : estadoBase === 'sin_respuesta' ? 'advertencia' : 'error';

  if (variante === 'usuario') {
    return (
      <footer className="footer footer--usuario">
        <div className="contenedor footer__contenido">
          <span>ApuestaDB · Saldo ficticio, sin dinero real · Juego responsable</span>
          <span className="footer__estado">
            <span className="texto-pequeno">Cuenta de practica</span>
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="contenedor footer__contenido">
        <span>
          ApuestaDB · Proyecto academico de Bases de Datos 2 · Tecnologico de Antioquia. Saldo
          ficticio: sin dinero real ni pasarelas de pago.
        </span>

        <span className="footer__estado">
          {cargando && <Loader tamano="sm" texto="Consultando API..." />}

          {!cargando && error && <Badge tipo="error">API sin respuesta</Badge>}

          {!cargando && !error && datos && (
            <>
              <Badge tipo="exito">API {datos.version}</Badge>
              <Badge tipo={tipoBase}>BD {estadoBase || 'desconocida'}</Badge>
              <span className="texto-pequeno">entorno: {datos.entorno}</span>
            </>
          )}
        </span>
      </div>
    </footer>
  );
}
