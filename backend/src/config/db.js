const { Sequelize } = require('sequelize');
require('dotenv').config();

// Conexión a MySQL con Sequelize.
// Importante (ADR-0004): el esquema lo crean los scripts SQL de docs/02-diseno/sql/.
// Sequelize solo lee y escribe datos; nunca se llama a sequelize.sync().
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: '-06:00', // hora del centro de México (sin horario de verano)
    logging: false,
    dialectOptions: {
      decimalNumbers: true, // las calificaciones DECIMAL llegan como número (95.5) y no como texto ('95.50')
    },
    define: {
      freezeTableName: true, // usa el nombre de la tabla tal cual (usuario, no usuarios)
      timestamps: false,     // las tablas no tienen createdAt/updatedAt
    },
  }
);

module.exports = sequelize;
