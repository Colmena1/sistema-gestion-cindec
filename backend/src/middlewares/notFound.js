const AppError = require('../utils/AppError');

// Cualquier ruta que no exista responde 404 en formato JSON.
module.exports = (req, res, next) => {
  next(new AppError(404, `No existe la ruta ${req.method} ${req.originalUrl}`));
};
