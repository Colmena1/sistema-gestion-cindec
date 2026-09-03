// Punto central de registro de modelos Sequelize.
// Cada módulo (usuarios, cursos, etc.) exporta su modelo aquí conforme
// se vaya diseñando el modelo entidad-relación en docs/02-diseno/.
const sequelize = require('../config/db');

const db = { sequelize };

// Ejemplo de cómo se irán agregando modelos más adelante:
// db.Usuario = require('./usuario.model')(sequelize);

module.exports = db;
