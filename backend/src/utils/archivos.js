const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');
const AppError = require('./AppError');

// Archivos subidos al sistema (Diseño, cap. 2): se guardan en backend/uploads/, FUERA de
// cualquier carpeta pública; en la base de datos solo se registra su ruta relativa.
// Solo se descargan a través de la API, que revisa permisos.
const CARPETA_BASE = path.resolve(__dirname, '../../uploads');

const TIPOS = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};
const MB = 1024 * 1024;

// multer guarda el archivo en memoria mientras se valida; se escribe en disco
// solo cuando la operación en la base de datos ya está lista.
const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * MB, files: 6 },
  fileFilter: (req, archivo, cb) => {
    if (!TIPOS[archivo.mimetype]) {
      return cb(new AppError(400, `El archivo "${archivo.originalname}" no es PDF, JPG ni PNG.`));
    }
    cb(null, true);
  },
});

// Materiales de aprendizaje (RF-APR-01): además de PDF e imágenes, documentos de Office.
const TIPOS_MATERIAL = {
  ...TIPOS,
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};
const subirMaterial = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * MB, files: 1 },
  fileFilter: (req, archivo, cb) => {
    if (!TIPOS_MATERIAL[archivo.mimetype]) {
      return cb(new AppError(400, `El archivo "${archivo.originalname}" no es de un tipo permitido (PDF, Word, PowerPoint, Excel, JPG o PNG).`));
    }
    cb(null, true);
  },
});

// Evidencias de evaluación (RF-EVA-02): PDF, imágenes y Word, hasta 10 MB.
const TIPOS_EVIDENCIA = {
  ...TIPOS,
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const subirEvidencia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * MB, files: 1 },
  fileFilter: (req, archivo, cb) => {
    if (!TIPOS_EVIDENCIA[archivo.mimetype]) {
      return cb(new AppError(400, `El archivo "${archivo.originalname}" no es de un tipo permitido (PDF, Word, JPG o PNG).`));
    }
    cb(null, true);
  },
});

// Tamaño máximo según la ruta que recibió el archivo
function mensajeTamano(url) {
  if (url.includes('materiales')) return 'El material debe pesar como máximo 20 MB.';
  if (url.includes('evidencias')) return 'La evidencia debe pesar como máximo 10 MB.';
  return 'Cada archivo debe pesar como máximo 5 MB.';
}

// Convierte los errores de multer en mensajes claros.
function manejarErrorMulter(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const mensajes = {
      LIMIT_FILE_SIZE: mensajeTamano(req.originalUrl),
      LIMIT_FILE_COUNT: 'Se enviaron demasiados archivos.',
      LIMIT_UNEXPECTED_FILE: 'Se recibió un archivo que no se esperaba.',
    };
    return next(new AppError(400, mensajes[err.code] || 'No se pudo recibir el archivo.'));
  }
  next(err);
}

const extension = (archivo) => TIPOS_MATERIAL[archivo.mimetype];

// Escribe el archivo y devuelve su ruta relativa (la que se guarda en la base de datos).
async function guardar(carpetaRelativa, nombreSinExtension, archivo) {
  const relativa = path.posix.join(carpetaRelativa, `${nombreSinExtension}${extension(archivo)}`);
  const absoluta = path.join(CARPETA_BASE, relativa);
  await fs.mkdir(path.dirname(absoluta), { recursive: true });
  await fs.writeFile(absoluta, archivo.buffer);
  return relativa;
}

async function eliminar(relativa) {
  try { await fs.unlink(path.join(CARPETA_BASE, relativa)); } catch { /* ya no existía */ }
}

// Ruta absoluta de un archivo guardado, sin permitir salir de la carpeta uploads/.
function rutaAbsoluta(relativa) {
  const absoluta = path.resolve(CARPETA_BASE, relativa);
  if (!absoluta.startsWith(CARPETA_BASE + path.sep)) throw new AppError(400, 'Ruta de archivo no válida.');
  return absoluta;
}

module.exports = { subir, subirMaterial, subirEvidencia, manejarErrorMulter, guardar, eliminar, rutaAbsoluta, MB };
