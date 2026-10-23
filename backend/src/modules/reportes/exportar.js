const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// ---------------------------------------------------------------------
// Exportación de reportes (RF-REP-02): PDF (pdfkit) y Excel (exceljs).
// Encabezado oficial (ADR-0005): razón social, cédula ECE516-22, logotipo de CINDEC y
// logotipo Red CONOCER de Entidad de Certificación y Evaluación (mínimo 3 cm de ancho).
// ---------------------------------------------------------------------

const RAZON_SOCIAL = 'Compromiso Compartido, Centro Integral de Desarrollo y Capacitación A.C.';
const CEDULA = 'Entidad de Certificación y Evaluación ECE516-22';
const LOGO_CINDEC = path.resolve(__dirname, '../../../assets/logo-cindec.png');
const LOGO_RED = path.resolve(__dirname, '../../../assets/logo-red-conocer.png');
const existe = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

const AZUL = '#02258B';
const GRIS_TEXTO = '#4C4B55';
const GRIS_MEDIO = '#6B6A75';
const GRIS_LINEA = '#E7E6EB';
const FONDO_ALTERNO = '#F6F6F9';

const valorTexto = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

// ============================== PDF ==============================
function generarPDF(rep, meta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margins: { top: 36, bottom: 40, left: 36, right: 36 }, bufferPages: true, info: { Title: rep.titulo, Author: RAZON_SOCIAL } });
    const partes = [];
    doc.on('data', (p) => partes.push(p));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const izq = doc.page.margins.left;
    const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const limiteInferior = () => doc.page.height - doc.page.margins.bottom - 14; // espacio para el pie

    // ---- Encabezado (solo en la primera página) ----
    let y = doc.page.margins.top;
    if (existe(LOGO_CINDEC)) doc.image(LOGO_CINDEC, izq, y, { width: 130 });
    if (existe(LOGO_RED)) doc.image(LOGO_RED, izq + ancho - 90, y - 2, { width: 90 }); // 90 pt ≈ 3.2 cm (mínimo 3 cm)
    doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(11).text(RAZON_SOCIAL, izq + 145, y + 4, { width: ancho - 250, align: 'center' });
    doc.fillColor(GRIS_MEDIO).font('Helvetica').fontSize(9).text(CEDULA, izq + 145, doc.y + 2, { width: ancho - 250, align: 'center' });
    y = y + 62;
    doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(16).text(rep.titulo, izq, y, { width: ancho });
    doc.fillColor(GRIS_MEDIO).font('Helvetica').fontSize(9).text(rep.descripcion, izq, doc.y + 2, { width: ancho });
    doc.text([...rep.filtrosTexto, `Generado el ${meta.fecha} por ${meta.usuario}`].join('   ·   '), izq, doc.y + 2, { width: ancho });
    y = doc.y + 8;

    // ---- Resumen en recuadros ----
    if (rep.resumen.length) {
      const cajas = rep.resumen.slice(0, 6);
      const anchoCaja = Math.min(140, (ancho - (cajas.length - 1) * 8) / cajas.length);
      cajas.forEach((r, i) => {
        const x = izq + i * (anchoCaja + 8);
        doc.roundedRect(x, y, anchoCaja, 38, 4).fillAndStroke(FONDO_ALTERNO, GRIS_LINEA);
        doc.fillColor(GRIS_MEDIO).font('Helvetica').fontSize(8).text(r.etiqueta, x + 8, y + 6, { width: anchoCaja - 16, lineBreak: false, ellipsis: true });
        doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(14).text(String(r.valor), x + 8, y + 18, { width: anchoCaja - 16 });
      });
      y += 50;
    }

    // ---- Tabla ----
    const totalPeso = rep.columnas.reduce((a, c) => a + c.ancho, 0);
    const anchos = rep.columnas.map((c) => (c.ancho / totalPeso) * ancho);
    const pad = 4;
    const encabezadoTabla = () => {
      doc.font('Helvetica-Bold').fontSize(8);
      const alto = Math.max(...rep.columnas.map((c, i) => doc.heightOfString(c.titulo, { width: anchos[i] - pad * 2 }))) + pad * 2;
      doc.rect(izq, y, ancho, alto).fill(AZUL);
      let x = izq;
      rep.columnas.forEach((c, i) => {
        doc.fillColor('#FFFFFF').text(c.titulo, x + pad, y + pad, { width: anchos[i] - pad * 2, align: c.alinear });
        x += anchos[i];
      });
      y += alto;
    };

    if (!rep.filas.length) {
      doc.fillColor(GRIS_MEDIO).font('Helvetica-Oblique').fontSize(10).text('No hay registros con los filtros elegidos.', izq, y + 10, { width: ancho, align: 'center' });
    } else {
      encabezadoTabla();
      doc.font('Helvetica').fontSize(8);
      rep.filas.forEach((fila, n) => {
        const textos = rep.columnas.map((c) => valorTexto(fila[c.clave]));
        const alto = Math.max(...textos.map((t, i) => doc.heightOfString(t, { width: anchos[i] - pad * 2 }))) + pad * 2;
        if (y + alto > limiteInferior()) {
          doc.addPage();
          y = doc.page.margins.top;
          encabezadoTabla();
          doc.font('Helvetica').fontSize(8);
        }
        if (n % 2 === 1) doc.rect(izq, y, ancho, alto).fill(FONDO_ALTERNO);
        let x = izq;
        textos.forEach((t, i) => {
          doc.fillColor(GRIS_TEXTO).text(t, x + pad, y + pad, { width: anchos[i] - pad * 2, align: rep.columnas[i].alinear });
          x += anchos[i];
        });
        doc.moveTo(izq, y + alto).lineTo(izq + ancho, y + alto).lineWidth(0.5).strokeColor(GRIS_LINEA).stroke();
        y += alto;
      });
      doc.fillColor(GRIS_MEDIO).font('Helvetica').fontSize(8).text(`${rep.filas.length} registro(s)`, izq, y + 6, { width: ancho, align: 'right' });
    }

    // ---- Pie con número de página en todas las páginas ----
    const rango = doc.bufferedPageRange();
    for (let i = rango.start; i < rango.start + rango.count; i += 1) {
      doc.switchToPage(i);
      const margenOriginal = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // escribir en el margen sin que pdfkit agregue otra página
      const yPie = doc.page.height - 28;
      doc.fillColor(GRIS_MEDIO).font('Helvetica').fontSize(7.5)
        .text(`${RAZON_SOCIAL} · ${CEDULA} · ${rep.titulo}`, izq, yPie, { width: ancho - 80, lineBreak: false, ellipsis: true })
        .text(`Página ${i - rango.start + 1} de ${rango.count}`, izq + ancho - 80, yPie, { width: 80, align: 'right', lineBreak: false });
      doc.page.margins.bottom = margenOriginal;
    }
    doc.end();
  });
}

// ============================== Excel ==============================
async function generarExcel(rep, meta) {
  const libro = new ExcelJS.Workbook();
  libro.creator = RAZON_SOCIAL;
  libro.created = new Date();
  const nombreHoja = rep.titulo.replace(/[\\/*?:[\]]/g, '').slice(0, 31);
  const hoja = libro.addWorksheet(nombreHoja, { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 1 } });
  const nCols = rep.columnas.length;
  const ultimaCol = Math.max(nCols, 4);

  // Logotipos (filas 1 a 4)
  if (existe(LOGO_CINDEC)) hoja.addImage(libro.addImage({ filename: LOGO_CINDEC, extension: 'png' }), { tl: { col: 0, row: 0 }, ext: { width: 170, height: 68 } });
  if (existe(LOGO_RED)) hoja.addImage(libro.addImage({ filename: LOGO_RED, extension: 'png' }), { tl: { col: ultimaCol - 1, row: 0 }, ext: { width: 120, height: 66 } });
  const titulo = (fila, texto, fuente) => {
    hoja.mergeCells(fila, 2, fila, Math.max(2, ultimaCol - 1));
    const celda = hoja.getCell(fila, 2);
    celda.value = texto;
    celda.font = fuente;
    celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  };
  titulo(1, RAZON_SOCIAL, { bold: true, size: 12, color: { argb: 'FF02258B' } });
  titulo(2, CEDULA, { size: 10, color: { argb: 'FF6B6A75' } });
  hoja.getRow(1).height = 24;
  hoja.getRow(2).height = 20;
  hoja.getRow(3).height = 8;
  hoja.getRow(4).height = 20;

  let fila = 5;
  hoja.getCell(fila, 1).value = rep.titulo;
  hoja.getCell(fila, 1).font = { bold: true, size: 14, color: { argb: 'FF02258B' } };
  fila += 1;
  [rep.descripcion, ...rep.filtrosTexto, `Generado el ${meta.fecha} por ${meta.usuario}`].forEach((t) => {
    hoja.getCell(fila, 1).value = t;
    hoja.getCell(fila, 1).font = { size: 9, color: { argb: 'FF6B6A75' } };
    fila += 1;
  });

  // Resumen
  fila += 1;
  rep.resumen.forEach((r) => {
    hoja.getCell(fila, 1).value = r.etiqueta;
    hoja.getCell(fila, 1).font = { color: { argb: 'FF6B6A75' } };
    hoja.getCell(fila, 2).value = r.valor;
    hoja.getCell(fila, 2).font = { bold: true, color: { argb: 'FF02258B' } };
    hoja.getCell(fila, 2).alignment = { horizontal: 'left' };
    fila += 1;
  });
  fila += 1;

  // Tabla
  const filaEncabezado = fila;
  rep.columnas.forEach((c, i) => {
    const celda = hoja.getCell(fila, i + 1);
    celda.value = c.titulo;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF02258B' } };
    celda.alignment = { vertical: 'middle', wrapText: true, horizontal: c.alinear === 'right' ? 'right' : 'left' };
  });
  hoja.getRow(fila).height = 30;
  rep.filas.forEach((f, n) => {
    fila += 1;
    rep.columnas.forEach((c, i) => {
      const celda = hoja.getCell(fila, i + 1);
      const v = f[c.clave];
      celda.value = v === null || v === undefined || v === '' ? '—' : v;
      celda.alignment = { vertical: 'top', wrapText: true, horizontal: c.alinear === 'right' ? 'right' : 'left' };
      celda.border = { bottom: { style: 'thin', color: { argb: 'FFE7E6EB' } } };
      if (n % 2 === 1) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F6F9' } };
    });
  });
  if (!rep.filas.length) {
    fila += 1;
    hoja.getCell(fila, 1).value = 'No hay registros con los filtros elegidos.';
    hoja.getCell(fila, 1).font = { italic: true, color: { argb: 'FF6B6A75' } };
  } else {
    hoja.autoFilter = { from: { row: filaEncabezado, column: 1 }, to: { row: filaEncabezado, column: nCols } };
  }

  // Anchos de columna aproximados al contenido
  rep.columnas.forEach((c, i) => {
    const largo = Math.max(c.titulo.length, ...rep.filas.slice(0, 300).map((f) => String(f[c.clave] ?? '').length));
    hoja.getColumn(i + 1).width = Math.min(45, Math.max(12, largo + 2));
  });
  if (hoja.getColumn(1).width < 22) hoja.getColumn(1).width = 22;

  return Buffer.from(await libro.xlsx.writeBuffer());
}

module.exports = { generarPDF, generarExcel, RAZON_SOCIAL };
