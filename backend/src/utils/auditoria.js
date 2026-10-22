const { Auditoria } = require('../models');

// Registra una operación sensible en la tabla auditoria (RF-USR-04, RNF-07):
// quién la hizo, qué acción, sobre qué tabla y registro, y un detalle legible.
// Se llama dentro de la misma transacción que la operación, para que no quede
// un cambio sin su registro de auditoría (o al revés).
async function registrarAuditoria({ idUsuario, accion, entidad, idRegistro, detalle }, transaction) {
  await Auditoria.create({
    id_usuario: idUsuario,
    accion,
    entidad_afectada: entidad,
    id_registro_afectado: idRegistro,
    detalle: detalle || null,
  }, { transaction });
}

module.exports = { registrarAuditoria };
