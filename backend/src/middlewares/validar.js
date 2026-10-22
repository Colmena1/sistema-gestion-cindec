const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Se coloca después de las reglas de express-validator en una ruta.
// Si alguna regla falló, responde 400 con la lista de campos y mensajes (RNF-09).
module.exports = (req, res, next) => {
  const errores = validationResult(req);
  if (errores.isEmpty()) return next();
  const detalles = errores.array().map((e) => ({ campo: e.path, mensaje: e.msg }));
  next(new AppError(400, 'Datos no válidos', detalles));
};
