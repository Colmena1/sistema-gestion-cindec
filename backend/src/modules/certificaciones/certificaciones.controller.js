const s = require('./tramites.service');

// Controladores del módulo Certificaciones (RNF-16).
module.exports = {
  listar: async (req, res) => res.json({ ok: true, ...await s.listar(req.query) }),
  candidatos: async (req, res) => res.json({ ok: true, candidatos: await s.candidatos() }),
  crear: async (req, res) => {
    const r = await s.crear(req.body, req.usuario.id);
    res.status(201).json({ ok: true, mensaje: `Trámite ${r.folio} iniciado.`, tramite: r });
  },
  obtener: async (req, res) => res.json({ ok: true, tramite: await s.obtener(req.params.id) }),
  avanzar: async (req, res) => {
    const r = await s.avanzar(req.params.id, req.body, req.usuario.id);
    res.json({ ok: true, mensaje: `Trámite ${r.folio}: ${r.estatus}.` });
  },
  documento: async (req, res) => {
    const r = await s.resguardarDocumento(req.params.id, req.body, req.file, req.usuario.id);
    res.status(201).json({
      ok: true,
      mensaje: `Certificado resguardado. El trámite ${r.folio} quedó emitido y se enviará el aviso por correo al participante.`,
    });
  },
  descargar: async (req, res) => {
    const { ruta, nombre } = await s.archivoDocumento(req.params.id, req.usuario);
    res.download(ruta, nombre);
  },
  misCertificados: async (req, res) => res.json({ ok: true, certificados: await s.misCertificados(req.usuario.id) }),
  miHistorial: async (req, res) => res.json({ ok: true, ...await s.miHistorial(req.usuario.id) }),
  verificar: async (req, res) => res.json({ ok: true, resultado: await s.verificar(req.query.folio) }),
};
