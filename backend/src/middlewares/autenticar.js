const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { Usuario, Rol } = require('../models');

// Verifica que la petición traiga un token JWT válido (RNF-03).
// Si es válido, deja los datos del usuario en req.usuario para el resto de la petición.
// Además consulta la base de datos en cada petición: si un administrador desactiva
// una cuenta, esa persona pierde el acceso de inmediato, aunque su token no haya vencido.
module.exports = async (req, res, next) => {
  try {
    const encabezado = req.headers.authorization || '';
    const [tipo, token] = encabezado.split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new AppError(401, 'Debe iniciar sesión para continuar.');
    }

    let datos;
    try {
      datos = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new AppError(401, 'Su sesión expiró. Inicie sesión de nuevo.');
    }

    const usuario = await Usuario.findByPk(datos.sub, { include: { model: Rol, as: 'rol' } });
    if (!usuario || !usuario.activo) {
      throw new AppError(401, 'Su cuenta no está activa. Comuníquese con la administración de CINDEC.');
    }

    req.usuario = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol.nombre,
    };
    next();
  } catch (err) {
    next(err);
  }
};
