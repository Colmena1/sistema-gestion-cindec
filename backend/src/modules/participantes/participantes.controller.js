const s = require('./participantes.service');

// multer entrega req.files como { campo: [archivo] }; aquí se deja un archivo por campo.
const unoPorCampo = (files) => Object.fromEntries(Object.entries(files || {}).map(([k, v]) => [k, v[0]]));

module.exports = {
  cursosDisponibles: async (req, res) => res.json({ ok: true, cursos: await s.cursosDisponibles() }),
  verificar: async (req, res) => res.json({ ok: true, ...await s.verificarDisponibilidad(req.body) }),

  autorregistro: async (req, res) => {
    await s.registrar(req.body, unoPorCampo(req.files), { origen: 'autorregistro' });
    res.status(201).json({ ok: true, mensaje: 'Su registro se completó. Ya puede iniciar sesión con su correo y contraseña.' });
  },
  registrarPorCoordinacion: async (req, res) => {
    const { id } = await s.registrar(req.body, unoPorCampo(req.files), { origen: 'alta_coordinador', idQuienRegistra: req.usuario.id });
    res.status(201).json({ ok: true, mensaje: 'Participante registrado.', id });
  },

  listar: async (req, res) => res.json({ ok: true, ...await s.listar(req.query) }),
  expediente: async (req, res) => res.json({ ok: true, participante: await s.expediente(req.params.id) }),
  actualizar: async (req, res) => { await s.actualizar(req.params.id, req.body, req.usuario.id); res.json({ ok: true, mensaje: 'Cambios guardados.' }); },
  agregarDocumento: async (req, res) => {
    await s.agregarDocumento(req.params.id, req.body.tipoDocumento, req.file, req.usuario.id);
    res.status(201).json({ ok: true, mensaje: 'Documento agregado.' });
  },
  archivoDocumento: async (req, res) => {
    const { ruta, nombre } = await s.archivoDocumento(req.params.id, req.usuario);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(nombre)}`);
    res.sendFile(ruta);
  },
};
