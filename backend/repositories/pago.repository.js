'use strict';

const postgresql = require('../config/db/postgresql');

async function crear({ referencia, idUsuario, idTipoSaldo, montoCentavos, moneda = 'COP' }) {
  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query(
    `INSERT INTO PagoWompi (referencia, id_usuario, id_tipo_saldo, monto_centavos, moneda)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [referencia, idUsuario, idTipoSaldo, montoCentavos, moneda],
  );
  return rows[0];
}

async function obtener(referencia) {
  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query('SELECT * FROM PagoWompi WHERE referencia = $1', [referencia]);
  return rows[0] || null;
}

async function obtenerPorEvento(eventoId) {
  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query('SELECT * FROM PagoWompi WHERE evento_id = $1', [eventoId]);
  return rows[0] || null;
}

async function marcarAprobado(referencia, { transactionId, eventoId, payloadHash }) {
  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query(
    `UPDATE PagoWompi
        SET estado='APROBADO', transaction_id=$2, evento_id=$3, payload_hash=$4, actualizado=CURRENT_TIMESTAMP
      WHERE referencia=$1 AND estado <> 'APROBADO'
      RETURNING *`,
    [referencia, transactionId, eventoId, payloadHash],
  );
  return rows[0] || null;
}

async function marcarEstado(referencia, estado, { transactionId = null, eventoId = null, payloadHash = null } = {}) {
  const pool = await postgresql.obtenerPool();
  const { rows } = await pool.query(
    `UPDATE PagoWompi
        SET estado=$2, transaction_id=COALESCE($3, transaction_id),
            evento_id=COALESCE($4, evento_id), payload_hash=COALESCE($5, payload_hash),
            actualizado=CURRENT_TIMESTAMP
      WHERE referencia=$1
      RETURNING *`,
    [referencia, estado, transactionId, eventoId, payloadHash],
  );
  return rows[0] || null;
}

module.exports = { crear, obtener, obtenerPorEvento, marcarAprobado, marcarEstado };
