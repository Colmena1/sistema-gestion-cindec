const crypto = require('crypto');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');
const { cifrar } = require('../../utils/contrasena');
const { registrarAuditoria } = require('../../utils/auditoria');
const { plantilla, enviarCorreo } = require('../notificaciones/correo.service');
const { Usuario, Rol, TokenRecuperacion, sequelize } = require('../../models');

const MINUTOS_VIGENCIA_ENLACE = 30;

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

// ---------------------------------------------------------------------
// CU-02 Recuperar contraseña (RF-USR-06), «include» CU-21 Enviar notificación
// 1. La persona escribe su correo. La respuesta es SIEMPRE la misma, exista o no
//    la cuenta, para no revelar qué correos están registrados.
// 2. Si la cuenta existe y está activa: se genera un token aleatorio de un solo uso,
//    se guarda solo su hash SHA-256 (como una contraseña) con vencimiento de 30 minutos
//    y se envía por correo un enlace que lo contiene.
// 3. Al abrir el enlace, se valida el token y se define la contraseña nueva.
//    El token queda marcado como usado y el cambio se registra en auditoría.
// ---------------------------------------------------------------------
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function solicitarRecuperacion(correo) {
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario || !usuario.activo) return; // misma respuesta para el usuario, sin enviar nada

  const token = crypto.randomBytes(32).toString('hex');
  const vence = new Date(Date.now() + MINUTOS_VIGENCIA_ENLACE * 60 * 1000);

  await sequelize.transaction(async (t) => {
    // Un enlace nuevo anula los anteriores que no se hayan usado
    await TokenRecuperacion.update(
      { usado: true },
      { where: { id_usuario: usuario.id_usuario, usado: false }, transaction: t },
    );
    await TokenRecuperacion.create({
      id_usuario: usuario.id_usuario,
      token_hash: hashToken(token),
      fecha_expiracion: vence,
    }, { transaction: t });
  });

  const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer?token=${token}`;
  try {
    await enviarCorreo({
    para: usuario.correo,
    asunto: 'Restablecer su contraseña — Sistema CINDEC',
    html: plantilla({
      titulo: 'Restablecer su contraseña',
      parrafos: [
        `Hola, ${usuario.nombre}.`,
        'Recibimos una solicitud para restablecer la contraseña de su cuenta en el Sistema de Gestión de Capacitación y Certificación de CINDEC.',
        `Para definir una contraseña nueva, use el siguiente botón. El enlace funciona una sola vez y vence en ${MINUTOS_VIGENCIA_ENLACE} minutos.`,
      ],
      boton: { texto: 'Definir contraseña nueva', url },
      notaFinal: 'Si usted no lo solicitó, ignore este mensaje: su contraseña actual sigue funcionando.',
    }),
    texto: `Hola, ${usuario.nombre}. Para restablecer su contraseña abra este enlace (vence en ${MINUTOS_VIGENCIA_ENLACE} minutos): ${url}`,
    });
  } catch (err) {
    console.error('No se pudo enviar el correo de recuperación:', err.message);
    throw new AppError(503, 'No se pudo enviar el correo en este momento. Inténtelo de nuevo en unos minutos.');
  }
}

async function buscarTokenVigente(token, transaction) {
  const registro = await TokenRecuperacion.findOne({
    where: { token_hash: hashToken(token), usado: false, fecha_expiracion: { [Op.gt]: new Date() } },
    include: { model: Usuario, as: 'usuario' },
    transaction,
  });
  if (!registro || !registro.usuario.activo) {
    throw new AppError(400, 'El enlace no es válido o ya venció. Solicite uno nuevo desde "¿Olvidó su contraseña?".');
  }
  return registro;
}

// Permite a la pantalla saber, al abrirse, si el enlace todavía sirve.
async function validarToken(token) {
  const registro = await buscarTokenVigente(token);
  return { nombre: registro.usuario.nombre };
}

async function restablecerContrasena(token, contrasena) {
  await sequelize.transaction(async (t) => {
    const registro = await buscarTokenVigente(token, t);
    await registro.usuario.update({ contrasena_hash: await cifrar(contrasena) }, { transaction: t });
    await registro.update({ usado: true }, { transaction: t });
    await registrarAuditoria({
      idUsuario: registro.id_usuario,
      accion: 'restablecer_contrasena',
      entidad: 'usuario',
      idRegistro: registro.id_usuario,
      detalle: 'Contraseña restablecida por el propio usuario mediante enlace enviado por correo',
    }, t);
  });
}

module.exports = { iniciarSesion, obtenerUsuarioActual, solicitarRecuperacion, validarToken, restablecerContrasena };
