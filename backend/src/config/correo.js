const nodemailer = require('nodemailer');

// Configuración del envío de correo (servicio externo SMTP, Diseño cap. 2).
// - Si el .env trae SMTP_HOST, se usa ese servidor real (Gmail, el correo de CINDEC, etc.).
// - Si no, en desarrollo se usa Ethereal: un buzón de PRUEBA gratuito. Los correos no
//   llegan a nadie; se ven en una página web cuyo enlace se imprime en la consola del backend.
let transportador = null;
let esPrueba = false;

async function obtenerTransportador() {
  if (transportador) return transportador;

  if (process.env.SMTP_HOST) {
    transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true solo para el puerto 465
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  } else {
    const cuenta = await nodemailer.createTestAccount();
    transportador = nodemailer.createTransport({
      host: cuenta.smtp.host,
      port: cuenta.smtp.port,
      secure: cuenta.smtp.secure,
      auth: { user: cuenta.user, pass: cuenta.pass },
    });
    esPrueba = true;
    console.log('Correo: usando buzón de prueba Ethereal (los correos no salen a internet).');
  }
  return transportador;
}

const remitente = () => process.env.CORREO_REMITENTE || 'Sistema CINDEC <no-responder@cindec.com>';

module.exports = { obtenerTransportador, remitente, usaBuzonDePrueba: () => esPrueba, nodemailer };
