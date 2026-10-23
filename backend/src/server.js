require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const { iniciarProgramador } = require('./modules/notificaciones/recordatorios.service');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Conectado a MySQL: ${process.env.DB_NAME} (puerto ${process.env.DB_PORT})`);
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err.message);
    console.error('Revisa el archivo .env y que el servicio MySQL80 esté iniciado.');
    process.exit(1); // sin base de datos la API no puede funcionar
  }

  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}/api/v1`);
    console.log(`Prueba de salud: http://localhost:${PORT}/api/v1/health`);
    iniciarProgramador(); // recordatorios por correo (RF-NOT-01)
  });
}

start();
