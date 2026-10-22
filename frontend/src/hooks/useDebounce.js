import { useEffect, useState } from 'react'

// Devuelve el valor solo cuando el usuario deja de escribir (para no consultar en cada tecla, RNF-15).
export default function useDebounce(valor, ms = 400) {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return retrasado
}
