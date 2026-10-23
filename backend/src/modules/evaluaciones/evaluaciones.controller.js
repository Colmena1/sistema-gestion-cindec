const instrumentos = require('./instrumentos.service');
const intentos = require('./intentos.service');

// Controladores del módulo Evaluaciones (RNF-16).
const ESTATUS_TEXTO = { aprobada: 'aprobada', no_aprobada: 'no aprobada' };
const DICTAMEN_TEXTO = { competente: 'competente', todavia_no_competente: 'todavía no competente' };

module.exports = {
  instrumentos: {
    listar: async (req, res) => res.json({ ok: true, instrumentos: await instrumentos.listar(req.query) }),
    crear: async (req, res) => res.status(201).json({ ok: true, mensaje: 'Instrumento registrado.', instrumento: await instrumentos.crear(req.body, req.usuario.id) }),
    actualizar: async (req, res) => res.json({ ok: true, mensaje: 'Cambios guardados.', instrumento: await instrumentos.actualizar(req.params.id, req.body, req.usuario.id) }),
    estado: async (req, res) => {
      const r = await instrumentos.cambiarEstado(req.params.id, req.body.activa, req.usuario.id);
      res.json({ ok: true, mensaje: `Instrumento "${r.nombre}" ${r.activa ? 'activado' : 'desactivado'}.` });
    },
  },
  porEvaluar: async (req, res) => res.json({ ok: true, grupos: await intentos.porEvaluar(req.usuario.id) }),
  intentos: {
    crear: async (req, res) => {
      const r = await intentos.crear(req.body, req.usuario);
      res.status(201).json({ ok: true, mensaje: `Intento ${r.numero} iniciado.`, intento: r });
    },
    obtener: async (req, res) => res.json({ ok: true, intento: await intentos.obtener(req.params.id, req.usuario) }),
    resultado: async (req, res) => {
      const r = await intentos.guardarResultado(req.params.id, req.body, req.usuario);
      res.json({ ok: true, mensaje: `Resultado guardado: ${r.nombre}, evaluación ${ESTATUS_TEXTO[r.estatus]}, ${DICTAMEN_TEXTO[r.dictamen]}.` });
    },
    eliminar: async (req, res) => { await intentos.eliminar(req.params.id, req.usuario); res.json({ ok: true, mensaje: 'Intento cancelado.' }); },
    agregarEvidencia: async (req, res) => {
      const r = await intentos.agregarEvidencia(req.params.id, req.body, req.file, req.usuario);
      res.status(201).json({ ok: true, mensaje: 'Evidencia agregada.', evidencia: r });
    },
  },
  evidencias: {
    quitar: async (req, res) => { await intentos.quitarEvidencia(req.params.id, req.usuario); res.json({ ok: true, mensaje: 'Evidencia quitada.' }); },
    descargar: async (req, res) => {
      const { ruta, nombre } = await intentos.archivoEvidencia(req.params.id, req.usuario);
      res.download(ruta, nombre);
    },
  },
};
