const s = require('./grupos.service');

// Controladores de grupos y sesiones (RNF-16). req.usuario.id queda en la auditoría.
module.exports = {
  listar: async (req, res) => res.json({ ok: true, ...await s.listar(req.query) }),
  personal: async (req, res) => res.json({ ok: true, ...await s.personalDisponible() }),
  obtener: async (req, res) => res.json({ ok: true, grupo: await s.obtenerDetalle(req.params.id) }),
  crear: async (req, res) => res.status(201).json({ ok: true, mensaje: 'Grupo creado.', grupo: await s.crear(req.body, req.usuario.id) }),
  actualizar: async (req, res) => res.json({ ok: true, mensaje: 'Cambios guardados.', grupo: await s.actualizar(req.params.id, req.body, req.usuario.id) }),
  estatus: async (req, res) => {
    const grupo = await s.cambiarEstatus(req.params.id, req.body.estatus, req.usuario.id);
    const textos = { en_curso: 'Grupo iniciado.', concluido: 'Grupo concluido.', cancelado: 'Grupo cancelado.' };
    res.json({ ok: true, mensaje: textos[grupo.estatus] || 'Estatus actualizado.', grupo });
  },
  agregarSesion: async (req, res) => { await s.agregarSesion(req.params.id, req.body, req.usuario.id); res.status(201).json({ ok: true, mensaje: 'Sesión agregada.' }); },
  actualizarSesion: async (req, res) => { await s.actualizarSesion(req.params.id, req.body, req.usuario.id); res.json({ ok: true, mensaje: 'Sesión actualizada.' }); },
  eliminarSesion: async (req, res) => { await s.eliminarSesion(req.params.id, req.usuario.id); res.json({ ok: true, mensaje: 'Sesión eliminada.' }); },
};
