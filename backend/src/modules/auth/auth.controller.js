const authService = require('./auth.service');

// El controlador solo recibe la petición y responde; la lógica está en el servicio (RNF-16).
async function login(req, res) {
  const { correo, contrasena } = req.body;
  const resultado = await authService.iniciarSesion(correo, contrasena);
  res.json({ ok: true, ...resultado });
}

async function yo(req, res) {
  const usuario = await authService.obtenerUsuarioActual(req.usuario.id);
  res.json({ ok: true, usuario });
}

async function recuperar(req, res) {
  await authService.solicitarRecuperacion(req.body.correo);
  // Misma respuesta siempre: no se revela si el correo está registrado.
  res.json({
    ok: true,
    mensaje: 'Si el correo está registrado, en unos minutos recibirá un enlace para definir una contraseña nueva. Revise también su carpeta de correo no deseado.',
  });
}

async function validarToken(req, res) {
  const datos = await authService.validarToken(req.query.token);
  res.json({ ok: true, ...datos });
}

async function restablecer(req, res) {
  await authService.restablecerContrasena(req.body.token, req.body.contrasena);
  res.json({ ok: true, mensaje: 'Su contraseña se cambió correctamente. Ya puede iniciar sesión con ella.' });
}

module.exports = { login, yo, recuperar, validarToken, restablecer };
