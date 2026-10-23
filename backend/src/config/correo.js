const nodemailer = require('nodemailer');

// Configuración del envío de correo (servicio externo SMTP, Diseño cap. 2).
// Tres modos:
//  1. SMTP real: si el .env trae SMTP_HOST (Gmail, el correo de CINDEC, etc.).
//  2. Ethereal (desarrollo): buzón de PRUEBA gratuito; los correos no llegan a nadie y el enlace
//     para verlos se imprime en la consola del backend.
//  3. Archivo (desarrollo): si CORREO_MODO=archivo, o si Ethereal no responde, cada correo se guarda
//     como página .html en backend/correos-prueba/ para abrirlo con el navegador. Así las pruebas no
//     dependen de un servicio de internet.
let transportador = null;
let modo = null; // 'smtp' | 'ethereal' | 'archivo'

// Límites de espera: si el servidor de correo no responde, se avisa del error en vez de quedarse esperando
const tiempos = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 };

function usarArchivo(motivo) {
  transportador = nodemailer.createTransport({ streamTransport: true, buffer: true });
  modo = 'archivo';
  console.log(`Correo: ${motivo} Los correos se guardarán en backend/correos-prueba/ (ábralos con el navegador).`);
  return transportador;
}

async function obtenerTransportador() {
  if (transportador) return transportador;

  if (process.env.SMTP_HOST) {
    transportador = nodemailer.createTransport({
      ...tiempos,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true solo para el puerto 465
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    modo = 'smtp';
    return transportador;
  }
  if (process.env.CORREO_MODO === 'archivo') return usarArchivo('modo archivo activado (CORREO_MODO=archivo).');

  try {
    const cuenta = await Promise.race([
      nodemailer.createTestAccount(),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('sin respuesta en 10 segundos')), 10000)),
    ]);
    transportador = nodemailer.createTransport({
      ...tiempos,
      host: cuenta.smtp.host,
      port: cuenta.smtp.port,
      secure: cuenta.smtp.secure,
      auth: { user: cuenta.user, pass: cuenta.pass },
    });
    modo = 'ethereal';
    console.log('Correo: usando buzón de prueba Ethereal (los correos no salen a internet).');
    return transportador;
  } catch (err) {
    // Ethereal no responde: en desarrollo se guardan en archivo para no detener las pruebas
    return usarArchivo(`el buzón de prueba Ethereal no respondió (${err.message}).`);
  }
}

const remitente = () => process.env.CORREO_REMITENTE || 'Sistema CINDEC <no-responder@cindec.com>';

module.exports = { obtenerTransportador, remitente, modoCorreo: () => modo, usaBuzonDePrueba: () => modo === 'ethereal', nodemailer };
