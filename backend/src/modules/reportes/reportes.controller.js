const s = require('./reportes.service');
const { generarPDF, generarExcel } = require('./exportar');
const { registrarAuditoria } = require('../../utils/auditoria');
const { sequelize } = require('../../models');

// Controladores del módulo Reportes (RNF-16).
const ahora = () => new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
const hoyArchivo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
const filtros = (q) => ({ desde: q.desde, hasta: q.hasta, idCurso: q.idCurso, estatus: q.estatus });

// Toda exportación queda en la auditoría: quién sacó qué información del sistema (RNF-07)
async function auditarExportacion(usuario, rep, formato) {
  await sequelize.transaction((t) => registrarAuditoria({
    idUsuario: usuario.id, accion: 'exportar_reporte', entidad: 'reporte', idRegistro: 0,
    detalle: `${rep.titulo} (${formato.toUpperCase()}, ${rep.filas.length} registros) · ${rep.filtrosTexto.join(' · ')}`,
  }, t));
}

async function exportar(req, res, formato) {
  const rep = await s.generar(req.params.clave, filtros(req.query));
  const meta = { fecha: ahora(), usuario: `${req.usuario.nombre} ${req.usuario.apellidos}` };
  const archivo = formato === 'pdf' ? await generarPDF(rep, meta) : await generarExcel(rep, meta);
  await auditarExportacion(req.usuario, rep, formato);
  const nombre = `Reporte ${rep.titulo} ${hoyArchivo()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
  res.setHeader('Content-Type', formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="reporte.${formato === 'pdf' ? 'pdf' : 'xlsx'}"; filename*=UTF-8''${encodeURIComponent(nombre)}`);
  res.send(archivo);
}

module.exports = {
  catalogo: async (req, res) => res.json({ ok: true, reportes: s.catalogo() }),
  generar: async (req, res) => res.json({ ok: true, reporte: await s.generar(req.params.clave, filtros(req.query)) }),
  pdf: (req, res) => exportar(req, res, 'pdf'),
  excel: (req, res) => exportar(req, res, 'excel'),
};
