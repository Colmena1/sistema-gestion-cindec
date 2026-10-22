const { DataTypes } = require('sequelize');
const { ORIGEN_REGISTRO } = require('./enums');

// Tabla: participante
// Datos propios del participante; su cuenta está en usuario (RF-CUR-03).
// Fuente: docs/02-diseno/sql/03-modulo-cursos-participantes.sql
module.exports = (sequelize) =>
  sequelize.define('Participante', {
    id_participante:     { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    id_usuario:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK -> usuario; único (1 a 1)
    id_curso_interes:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // FK -> curso (SET NULL)
    telefono:            { type: DataTypes.STRING(15), allowNull: false },
    curp:                { type: DataTypes.CHAR(18), allowNull: false }, // única; siempre 18 caracteres
    empresa_procedencia: { type: DataTypes.STRING(150), allowNull: true }, // opcional
    origen_registro:     { type: DataTypes.ENUM(...ORIGEN_REGISTRO), allowNull: false },
  }, {
    tableName: 'participante',
  });
