const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());                                                   // cabeceras de seguridad
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));         // registra cada petición en consola

app.use('/api/v1', routes);   // API versionada (ver Diseño, cap. 2)

app.use(notFound);            // rutas inexistentes -> 404
app.use(errorHandler);        // siempre al final

module.exports = app;
