const { Sequelize } = require('sequelize');
require('dotenv').config();

// Conexión a MySQL usando Sequelize. Los modelos (src/models) se registran
// contra esta misma instancia para mantener una sola fuente de verdad de la BD.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;
