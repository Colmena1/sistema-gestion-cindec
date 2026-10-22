// Asigna una contraseña nueva a un usuario existente (herramienta de administración).
// Uso (desde la carpeta backend):
//   npm run asignar-contrasena -- correo@ejemplo.com MiContrasena123
require('dotenv').config();
const { Usuario, sequelize } = require('../src/models');
const { REGLA, MENSAJE_REGLA, cifrar } = require('../src/utils/contrasena');

async function main() {
  const [correo, contrasena] = process.argv.slice(2);
  if (!correo || !contrasena) {
    console.log('Uso: npm run asignar-contrasena -- correo@ejemplo.com MiContrasena123');
    process.exit(1);
  }
  if (!REGLA.test(contrasena)) {
    console.log(MENSAJE_REGLA);
    process.exit(1);
  }
  const usuario = await Usuario.findOne({ where: { correo: correo.toLowerCase() } });
  if (!usuario) {
    console.log(`No existe un usuario con el correo ${correo}.`);
    process.exit(1);
  }
  await usuario.update({ contrasena_hash: await cifrar(contrasena) });
  console.log(`Contraseña actualizada para ${usuario.nombre} ${usuario.apellidos} (${correo}).`);
  await sequelize.close();
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
