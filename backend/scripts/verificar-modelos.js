// Verifica que los 20 modelos de Sequelize coincidan con las tablas reales de cindec_db.
// Uso (desde la carpeta backend):  npm run verificar-modelos
// Revisa, para cada tabla: que exista, que tenga las mismas columnas y el mismo "acepta nulos".
require('dotenv').config();
const db = require('../src/models');

// En el modelo, una llave primaria nunca acepta nulos aunque no diga allowNull: false
// (Sequelize lo da por hecho con primaryKey: true).
const aceptaNulos = (attr) => (attr.primaryKey ? false : attr.allowNull !== false);

async function main() {
  const qi = db.sequelize.getQueryInterface();
  let errores = 0;
  const modelos = Object.values(db).filter((m) => m && m.tableName && m.rawAttributes);

  for (const modelo of modelos) {
    const tabla = modelo.tableName;
    let real;
    try {
      real = await qi.describeTable(tabla);
    } catch {
      console.log(`✗ ${tabla}: la tabla no existe en la base de datos`);
      errores++;
      continue;
    }
    const problemas = [];
    const enModelo = Object.keys(modelo.rawAttributes);
    const enTabla = Object.keys(real);
    for (const col of enModelo) {
      if (!real[col]) problemas.push(`la columna "${col}" está en el modelo pero no en la tabla`);
      else if (real[col].allowNull !== aceptaNulos(modelo.rawAttributes[col]))
        problemas.push(`"${col}": el modelo y la tabla no coinciden en si acepta nulos`);
    }
    for (const col of enTabla) {
      if (!modelo.rawAttributes[col]) problemas.push(`la columna "${col}" está en la tabla pero no en el modelo`);
    }
    if (problemas.length) {
      errores += problemas.length;
      console.log(`✗ ${tabla}`);
      problemas.forEach((p) => console.log(`    - ${p}`));
    } else {
      console.log(`✓ ${tabla} (${enModelo.length} columnas)`);
    }
  }

  const relaciones = modelos.reduce(
    (n, m) => n + Object.values(m.associations).filter((a) => a.associationType === 'BelongsTo').length, 0);
  console.log(`\nModelos: ${modelos.length} · Relaciones (llaves foráneas): ${relaciones}`);
  console.log(errores === 0 ? 'Resultado: todo coincide con cindec_db.' : `Resultado: ${errores} diferencia(s) por corregir.`);
  await db.sequelize.close();
  process.exit(errores === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('No se pudo verificar:', err.message);
  process.exit(1);
});
