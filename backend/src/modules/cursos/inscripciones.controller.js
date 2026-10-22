const s = require('./inscripciones.service');
const mis = require('./mis.service');

// Controladores de inscripción, asistencia y consultas por rol (RNF-16).
module.exports = {
  candidatos: async (req, res) => res.json({ ok: true, participantes: await s.candidatos(req.params.id, req.query.buscar) }),
  inscribir: async (req, res) => {
    const { lugaresLibres } = await s.inscribir(req.params.id, req.body, req.usuario.id);
    res.status(201).json({ ok: true, mensaje: 'Participante inscrito.', lugaresLibres });
  },
  estatus: async (req, res) => {
    const { nombre, estatus } = await s.cambiarEstatus(req.params.id, req.body.estatus, req.usuario.id);
    const textos = { baja: `${nombre} quedó dado(a) de baja del grupo.`, inscrito: `${nombre} quedó inscrito(a) de nuevo.`, capacitacion_concluida: `Capacitación concluida para ${nombre}.` };
    res.json({ ok: true, mensaje: textos[estatus] });
  },
  obtenerAsistencia: async (req, res) => res.json({ ok: true, ...await s.obtenerAsistencia(req.params.id, req.usuario) }),
  guardarAsistencia: async (req, res) => {
    const { presentes, total } = await s.guardarAsistencia(req.params.id, req.body.registros, req.usuario);
    res.json({ ok: true, mensaje: `Asistencia guardada: ${presentes} de ${total} asistieron.` });
  },
  misGrupos: async (req, res) => res.json({ ok: true, grupos: await mis.misGrupos(req.usuario.id) }),
  misCursos: async (req, res) => res.json({ ok: true, cursos: await mis.misCursos(req.usuario.id) }),
};
