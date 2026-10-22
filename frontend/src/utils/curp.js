// Validación de CURP en el navegador (la misma regla que backend/src/utils/curp.js).
const FORMATO = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z\d]\d$/

export function fechaNacimiento(curp) {
  const aa = Number(curp.slice(4, 6))
  const mm = Number(curp.slice(6, 8))
  const dd = Number(curp.slice(8, 10))
  const siglo = /\d/.test(curp[16]) ? 1900 : 2000 // dígito = antes de 2000; letra = 2000 en adelante
  const fecha = new Date(siglo + aa, mm - 1, dd)
  return fecha.getMonth() === mm - 1 && fecha.getDate() === dd ? fecha : null
}

export const curpValida = (curp) => FORMATO.test(curp) && fechaNacimiento(curp) !== null

export function esMenorDeEdad(curp) {
  const n = curpValida(curp) ? fechaNacimiento(curp) : null
  if (!n) return false
  const hoy = new Date()
  let edad = hoy.getFullYear() - n.getFullYear()
  if (hoy.getMonth() < n.getMonth() || (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate())) edad -= 1
  return edad < 18
}
