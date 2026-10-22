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

module.exports = { login, yo };
