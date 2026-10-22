const {
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ValidationError,
  DatabaseError,
} = require('sequelize');

// Manejo de errores centralizado (RNF-12): todo error termina en una
// respuesta JSON uniforme: { ok: false, mensaje, detalles? }
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor';
  let detalles = err.detalles;

  if (err instanceof UniqueConstraintError) {
    status = 409;
    mensaje = 'Ya existe un registro con esos datos';
    detalles = err.errors?.map((e) => e.path);
  } else if (err instanceof ForeignKeyConstraintError) {
    status = 409;
    mensaje = 'La operación no es posible porque depende de otro registro (o hay registros que dependen de este)';
  } else if (err instanceof ValidationError) {
    status = 400;
    mensaje = 'Datos no válidos';
    detalles = err.errors?.map((e) => ({ campo: e.path, mensaje: e.message }));
  } else if (err instanceof DatabaseError && err.parent?.errno === 3819) {
    // 3819 = violación de una restricción CHECK de MySQL
    status = 400;
    mensaje = 'Los datos no cumplen una regla de la base de datos';
    detalles = err.parent.sqlMessage;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  }

  if (status >= 500) {
    console.error(err); // solo los errores inesperados se imprimen completos
    if (process.env.NODE_ENV === 'production') mensaje = 'Error interno del servidor';
  }

  const respuesta = { ok: false, mensaje };
  if (detalles) respuesta.detalles = detalles;
  res.status(status).json(respuesta);
};
