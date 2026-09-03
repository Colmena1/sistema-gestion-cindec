require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente.');
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err.message);
    console.error('Verifica tu archivo .env y que MySQL esté corriendo localmente.');
  }

  app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    console.log(`Prueba de salud: http://localhost:${PORT}/api/health`);
  });
}

start();
