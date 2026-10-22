// Error "esperado" de la aplicación: lleva el código HTTP que debe responderse.
// Ejemplo: throw new AppError(409, 'El grupo ya no tiene cupo disponible');
class AppError extends Error {
  constructor(status, message, detalles) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.detalles = detalles;
  }
}

module.exports = AppError;
