const s = require('./materiales.service');

// Controladores del módulo Aprendizaje (RNF-16).
module.exports = {
  cursosGestionables: async (req, res) => res.json({ ok: true, cursos: await s.cursosGestionables(req.usuario) }),
  listarDeCurso: async (req, res) => res.json({ ok: true, ...await s.listarDeCurso(req.params.id, req.usuario) }),
  crear: async (req, res) => res.status(201).json({ ok: true, mensaje: 'Material agregado.', material: await s.crear(req.params.id, req.body, req.file, req.usuario) }),
  actualizar: async (req, res) => res.json({ ok: true, mensaje: 'Cambios guardados.', material: await s.actualizar(req.params.id, req.body, req.usuario) }),
  eliminar: async (req, res) => { await s.eliminar(req.params.id, req.usuario); res.json({ ok: true, mensaje: 'Material eliminado.' }); },
  descargar: async (req, res) => {
    const { ruta, nombre } = await s.archivoParaDescargar(req.params.id, req.usuario);
    res.download(ruta, nombre);
  },
  video: async (req, res) => res.json({ ok: true, ...await s.abrirVideo(req.params.id, req.usuario) }),
  misMateriales: async (req, res) => res.json({ ok: true, cursos: await s.misMateriales(req.usuario.id) }),
};
