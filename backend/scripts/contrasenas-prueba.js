// SOLO PARA DESARROLLO: asigna la misma contraseña a todos los usuarios ficticios
// del script 08-datos-prueba.sql (correos @ejemplo.com), para poder probar cada rol.
// Uso (desde la carpeta backend):  npm run contrasenas-prueba
require('dotenv').config();
const { Op } = require('sequelize');
const { Usuario, Rol, sequelize } = require('../src/models');
const { cifrar } = require('../src/utils/contrasena');

const CONTRASENA_PRUEBA = 'Prueba2026';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Este script no se puede usar en producción.');
    process.exit(1);
  }
  const hash = await cifrar(CONTRASENA_PRUEBA);
  const usuarios = await Usuario.findAll({
    where: { correo: { [Op.like]: '%@ejemplo.com' } },
    include: { model: Rol, as: 'rol' },
    order: [['id_rol', 'ASC']],
  });
  for (const u of usuarios) await u.update({ contrasena_hash: hash });

  console.log(`Contraseña "${CONTRASENA_PRUEBA}" asignada a ${usuarios.length} usuarios de prueba:\n`);
  usuarios.forEach((u) => console.log(`  ${u.rol.nombre.padEnd(28)} ${u.correo}`));
  await sequelize.close();
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
