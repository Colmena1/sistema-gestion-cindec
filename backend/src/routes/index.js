const express = require('express');
const router = express.Router();

// Ruta de verificación de vida del servicio (útil para confirmar que el
// entorno está corriendo antes de empezar a construir módulos reales).
router.get('/health', (req, res) => {
  res.json({ status: 'ok', proyecto: 'Sistema CINDEC', fecha: new Date().toISOString() });
});

// Aquí se irán montando las rutas por módulo conforme se desarrollen:
// router.use('/usuarios', require('./usuarios.routes'));
// router.use('/cursos', require('./cursos.routes'));

module.exports = router;
