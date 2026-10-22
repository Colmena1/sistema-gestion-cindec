// Express 4 no atrapa los errores de funciones async. Este envoltorio los
// manda al middleware de errores para no repetir try/catch en cada controlador.
// Uso: router.get('/', asyncHandler(controlador.listar));
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
