// Campo de formulario: etiqueta visible arriba y, debajo, el error o una ayuda
// (guía de estilo, sección 6). Se usa en todos los formularios del sistema.
export default function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? <p className="campo__error">{error}</p> : ayuda && <p className="auxiliar">{ayuda}</p>}
    </div>
  )
}
