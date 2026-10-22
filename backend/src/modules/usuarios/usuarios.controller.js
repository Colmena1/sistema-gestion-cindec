const servicio = require('./usuarios.service');

// Controladores del módulo Usuarios: reciben la petición y responden (RNF-16).
// req.usuario.id es el administrador que hace la operación (para la auditoría).
module.exports = {
  roles: async (req, res) => res.json({ ok: true, roles: await servicio.listarRoles() }),

  listar: async (req, res) => {
    const { buscar, idRol, activo, pagina, limite } = req.query;
    res.json({ ok: true, ...await servicio.listar({ buscar, idRol, activo, pagina, limite }) });
  },

  obtener: async (req, res) => res.json({ ok: true, usuario: await servicio.obtener(req.params.id) }),

  crear: async (req, res) => {
    const usuario = await servicio.crear(req.body, req.usuario.id);
    res.status(201).json({ ok: true, mensaje: 'Usuario registrado.', usuario });
  },

  actualizar: async (req, res) => {
    const usuario = await servicio.actualizar(req.params.id, req.body, req.usuario.id);
    res.json({ ok: true, mensaje: 'Cambios guardados.', usuario });
  },

  cambiarEstado: async (req, res) => {
    const usuario = await servicio.cambiarEstado(req.params.id, req.body.activo, req.usuario.id);
    res.json({ ok: true, mensaje: usuario.activo ? 'Usuario activado.' : 'Usuario desactivado.', usuario });
  },
};
