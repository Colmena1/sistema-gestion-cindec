import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import logo from '../assets/logo-cindec.png'
import { MENU_POR_ROL, ROLES } from '../config/menu.js'
import { useSesion } from '../context/SesionContext.jsx'

// Estructura de todas las pantallas con sesión (guía de estilo, sección 5):
// menú lateral de 264 px + contenido de máximo 1120 px.
// En celular (menos de 900 px) el menú se oculta tras el botón ☰ (RNF-02).
export default function LayoutPrincipal() {
  const { usuario, cambiarRol, esDemo } = useSesion()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const opciones = MENU_POR_ROL[usuario.rol] || []
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <div className="app">
      <header className="barra-movil">
        <button className="boton-icono" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu size={24} />
        </button>
        <img src={logo} alt="CINDEC" className="barra-movil__logo" />
      </header>

      {menuAbierto && <div className="velo" onClick={cerrarMenu} />}

      <aside className={`menu ${menuAbierto ? 'menu--abierto' : ''}`}>
        <div className="menu__cabecera">
          <img src={logo} alt="CINDEC — Centro Integral de Desarrollo y Evaluación de Competencia Laboral" className="menu__logo" />
          <button className="boton-icono menu__cerrar" onClick={cerrarMenu} aria-label="Cerrar menú">
            <X size={22} />
          </button>
        </div>

        <nav className="menu__opciones">
          {opciones.map(({ ruta, texto, icono: Icono }) => (
            <NavLink key={ruta} to={ruta} end={ruta === '/'} onClick={cerrarMenu}
              className={({ isActive }) => `menu__opcion ${isActive ? 'menu__opcion--activa' : ''}`}>
              <Icono size={20} strokeWidth={1.75} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="menu__usuario">
          <strong>{usuario.nombre} {usuario.apellidos}</strong>
          <span>{usuario.rol}</span>
          {esDemo && (
            <label className="menu__demo">
              Ver menú como:
              <select value={usuario.rol} onChange={(e) => cambiarRol(e.target.value)}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
          )}
          <button className="menu__opcion menu__salir" disabled={esDemo} title={esDemo ? 'Disponible en el Sprint 1' : undefined}>
            <LogOut size={20} strokeWidth={1.75} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  )
}
