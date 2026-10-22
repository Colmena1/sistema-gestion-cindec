const estandares = require('./estandares.service');
const cursos = require('./cursos.service');

// Controladores de estándares y cursos (RNF-16). req.usuario.id queda en la auditoría.
module.exports = {
  estandares: {
    listar: async (req, res) => res.json({ ok: true, estandares: await estandares.listar(req.query) }),
    crear: async (req, res) => res.status(201).json({ ok: true, mensaje: 'Estándar registrado.', estandar: await estandares.crear(req.body, req.usuario.id) }),
    actualizar: async (req, res) => res.json({ ok: true, mensaje: 'Cambios guardados.', estandar: await estandares.actualizar(req.params.id, req.body, req.usuario.id) }),
    estado: async (req, res) => {
      const estandar = await estandares.cambiarEstado(req.params.id, req.body.activo, req.usuario.id);
      res.json({ ok: true, mensaje: estandar.activo ? 'Estándar activado.' : 'Estándar desactivado.', estandar });
    },
  },
  cursos: {
    listar: async (req, res) => res.json({ ok: true, cursos: await cursos.listar(req.query) }),
    obtener: async (req, res) => res.json({ ok: true, curso: await cursos.obtener(req.params.id) }),
    crear: async (req, res) => res.status(201).json({ ok: true, mensaje: 'Curso registrado.', curso: await cursos.crear(req.body, req.usuario.id) }),
    actualizar: async (req, res) => res.json({ ok: true, mensaje: 'Cambios guardados.', curso: await cursos.actualizar(req.params.id, req.body, req.usuario.id) }),
    estado: async (req, res) => {
      const curso = await cursos.cambiarEstado(req.params.id, req.body.activo, req.usuario.id);
      res.json({ ok: true, mensaje: curso.activo ? 'Curso activado.' : 'Curso desactivado.', curso });
    },
  },
};
