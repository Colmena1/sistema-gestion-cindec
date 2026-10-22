// Utilidades para la CURP (Clave Única de Registro de Población).
// Estructura: 4 letras + fecha de nacimiento AAMMDD + sexo (H/M/X) + 5 letras + 1 carácter + 1 dígito.
const FORMATO = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z\d]\d$/;

// Fecha de nacimiento contenida en la CURP. El carácter 17 indica el siglo:
// un dígito = nacido antes de 2000; una letra = nacido de 2000 en adelante.
function fechaNacimiento(curp) {
  const aa = Number(curp.slice(4, 6));
  const mm = Number(curp.slice(6, 8));
  const dd = Number(curp.slice(8, 10));
  const siglo = /\d/.test(curp[16]) ? 1900 : 2000;
  const fecha = new Date(siglo + aa, mm - 1, dd);
  if (fecha.getMonth() !== mm - 1 || fecha.getDate() !== dd) return null; // fecha imposible (p. ej. 31 de febrero)
  return fecha;
}

function esValida(curp) {
  return typeof curp === 'string' && FORMATO.test(curp) && fechaNacimiento(curp) !== null;
}

// Menor de edad = menos de 18 años cumplidos hoy (se pide identificación del tutor).
function esMenorDeEdad(curp) {
  const nacimiento = fechaNacimiento(curp);
  if (!nacimiento) return false;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) edad -= 1;
  return edad < 18;
}

module.exports = { esValida, esMenorDeEdad, fechaNacimiento };
