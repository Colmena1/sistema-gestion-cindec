const fs = require('fs/promises');
const path = require('path');
const { obtenerTransportador, remitente, modoCorreo, nodemailer } = require('../../config/correo');

const CARPETA_PRUEBA = path.resolve(__dirname, '../../../correos-prueba');

// Servicio de correo del módulo Notificaciones (CU-21, RF-NOT-01).
// Lo usan otros módulos para enviar avisos; aquí se arma el diseño común del mensaje.

const AZUL = '#02258B';

// Envuelve el contenido en una plantilla sencilla con la identidad de CINDEC.
function plantilla({ titulo, parrafos, boton, notaFinal }) {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 16px;line-height:1.5">${p}</p>`).join('');
  const btn = boton
    ? `<p style="margin:24px 0"><a href="${boton.url}" style="background:${AZUL};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">${boton.texto}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#6B6A75">Si el botón no funciona, copie esta dirección en su navegador:<br><span style="word-break:break-all">${boton.url}</span></p>`
    : '';
  const nota = notaFinal ? `<p style="margin:16px 0 0;font-size:13px;color:#6B6A75">${notaFinal}</p>` : '';
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F6F6F9;font-family:Arial,sans-serif;color:#4C4B55">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#FEFEFE;border:1px solid #E7E6EB;border-radius:12px;padding:32px">
      <p style="margin:0 0 24px;font-size:22px;font-weight:bold;color:${AZUL}">CINDEC</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#4C4B55">${titulo}</h1>
      ${cuerpo}${btn}${nota}
    </div>
    <p style="font-size:12px;color:#6B6A75;text-align:center;margin-top:16px">Centro Integral de Desarrollo y Evaluación de Competencia Laboral · Entidad de Certificación y Evaluación ECE516-22<br>Este es un mensaje automático; no responda a este correo.</p>
  </div></body></html>`;
}

// Envía un correo. Si se usa el buzón de prueba, imprime en consola el enlace para verlo.
async function enviarCorreo({ para, asunto, html, texto }) {
  const transportador = await obtenerTransportador();
  const info = await transportador.sendMail({ from: remitente(), to: para, subject: asunto, html, text: texto });
  if (modoCorreo() === 'ethereal') {
    console.log(`Correo de prueba para ${para} — ábralo aquí: ${nodemailer.getTestMessageUrl(info)}`);
  } else if (modoCorreo() === 'archivo') {
    // Se guarda una página con los datos del envío y el contenido tal como lo vería el destinatario
    await fs.mkdir(CARPETA_PRUEBA, { recursive: true });
    const sello = new Date().toISOString().replace(/[:.]/g, '-');
    const archivo = path.join(CARPETA_PRUEBA, `${sello}-${para.replace(/[^a-zA-Z0-9.@_-]/g, '_')}.html`);
    const cabecera = `<div style="font-family:Arial,sans-serif;font-size:13px;background:#FFF4D6;color:#8A5A00;padding:12px 16px;border-bottom:1px solid #E7E6EB">`
      + `<strong>Correo de prueba guardado por el Sistema CINDEC</strong> (no se envió por internet)<br>`
      + `Para: ${para} · Asunto: ${asunto} · ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</div>`;
    await fs.writeFile(archivo, html.replace(/<body([^>]*)>/, `<body$1>${cabecera}`), 'utf8');
    console.log(`Correo de prueba para ${para} — guardado en: ${archivo}`);
  }
  return info;
}

module.exports = { plantilla, enviarCorreo };
