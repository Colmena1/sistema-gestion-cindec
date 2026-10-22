// Nombres EXACTOS de los roles, tal como están en la tabla rol de cindec_db (RF-USR-02).
// Se usan en el backend para autorizar y deben coincidir con frontend/src/config/menu.js.
const ROLES = {
  ADMIN: 'Administrador general',
  COORDINADOR: 'Coordinador de capacitación',
  INSTRUCTOR: 'Instructor',
  EVALUADOR: 'Evaluador',
  PARTICIPANTE: 'Participante',
};

module.exports = ROLES;
