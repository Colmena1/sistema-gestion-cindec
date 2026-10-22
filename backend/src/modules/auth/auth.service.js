const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');
const { Usuario, Rol } = require('../../models');

// Mismo mensaje si el correo no existe o si la contraseña es incorrecta:
// así nadie puede averiguar qué correos están registrados.
const CREDENCIALES_INVALIDAS = 'El correo o la contraseña no son correctos.';

// Datos del usuario que se pueden enviar al frontend (nunca el hash de la contraseña).
function datosPublicos(usuario) {
  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    apellidos: usuario.apellidos,
    correo: usuario.correo,
    rol: usuario.rol.nombre,
    ultimoAcceso: usuario.ultimo_acceso,
  };
}

// CU-01 Iniciar sesión (RF-USR-05).
async function iniciarSesion(correo, contrasena) {
  const usuario = await Usuario.scope('conContrasena').findOne({
    where: { correo },
    include: { model: Rol, as: 'rol' },
  });
  if (!usuario) throw new AppError(401, CREDENCIALES_INVALIDAS);

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!coincide) throw new AppError(401, CREDENCIALES_INVALIDAS);

  if (!usuario.activo) {
    throw new AppError(403, 'Su cuenta está desactivada. Comuníquese con la administración de CINDEC.');
  }

  const accesoAnterior = usuario.ultimo_acceso;
  await usuario.update({ ultimo_acceso: new Date() });

  const token = jwt.sign(
    { sub: usuario.id_usuario, rol: usuario.rol.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );

  return { token, usuario: { ...datosPublicos(usuario), ultimoAcceso: accesoAnterior } };
}

// Datos de quien tiene la sesión abierta (el frontend los pide al recargar la página).
async function obtenerUsuarioActual(idUsuario) {
  const usuario = await Usuario.findByPk(idUsuario, { include: { model: Rol, as: 'rol' } });
  if (!usuario) throw new AppError(404, 'No se encontró el usuario.');
  return datosPublicos(usuario);
}

module.exports = { iniciarSesion, obtenerUsuarioActual };
