const AppError = require('../utils/AppError');

// Permite el paso solo a los roles indicados (RF-USR-03, RNF-04).
// Va DESPUÉS de autenticar. Ejemplo:
//   router.get('/', autenticar, autorizar(ROLES.ADMIN), controlador.listar);
// El frontend también oculta lo que cada rol no puede usar, pero la seguridad real está aquí.
module.exports = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) return next(new AppError(401, 'Debe iniciar sesión para continuar.'));
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return next(new AppError(403, 'Su rol no tiene permiso para realizar esta acción.'));
  }
  next();
};
