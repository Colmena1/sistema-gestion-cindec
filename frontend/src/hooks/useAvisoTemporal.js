import { useCallback, useEffect, useRef, useState } from 'react'

// Muestra un mensaje de confirmación durante unos segundos ("Curso registrado.").
export default function useAvisoTemporal(ms = 4000) {
  const [aviso, setAviso] = useState('')
  const temporizador = useRef(null)
  const mostrar = useCallback((texto) => {
    clearTimeout(temporizador.current)
    setAviso(texto)
    temporizador.current = setTimeout(() => setAviso(''), ms)
  }, [ms])
  useEffect(() => () => clearTimeout(temporizador.current), [])
  return [aviso, mostrar]
}
