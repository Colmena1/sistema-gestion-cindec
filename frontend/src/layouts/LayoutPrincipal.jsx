import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import logo from '../assets/logo-cindec.png'
import { MENU_POR_ROL, NOMBRE_CORTO_ROL } from '../config/menu.js'
import { useSesion } from '../context/SesionContext.jsx'

// Estructura de todas las pantallas con sesión (guía de estilo, sección 5):
// menú lateral de 264 px + contenido de máximo 1120 px.
// En computadora el menú se puede contraer a solo íconos (se recuerda la preferencia).
// En celular (menos de 900 px) el menú se oculta tras el botón ☰ (RNF-02).
const leerColapsado = () => { try { return localStorage.getItem('menuColapsado') === '1' } catch { return false } }
export default function LayoutPrincipal() {
  const { usuario, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [colapsado, setColapsado] = useState(leerColapsado)
  const opciones = MENU_POR_ROL[usuario.rol] || []
  const cerrarMenu = () => setMenuAbierto(false)

  const alternarColapsado = () => {
    setColapsado((c) => {
      try { localStorage.setItem('menuColapsado', c ? '0' : '1') } catch { /* sin almacenamiento */ }
      return !c
    })
  }

  const salir = () => {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className="app">
      <header className="barra-movil">
        <button className="boton-icono" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu size={24} />
        </button>
        <img src={logo} alt="CINDEC" className="barra-movil__logo" />
      </header>

      {menuAbierto && <div className="velo" onClick={cerrarMenu} />}

      <aside className={`menu ${menuAbierto ? 'menu--abierto' : ''} ${colapsado ? 'menu--colapsado' : ''}`}>
        <div className="menu__cabecera">
          <img src={logo} alt="CINDEC — Centro Integral de Desarrollo y Evaluación de Competencia Laboral" className="menu__logo" />
          <button className="boton-icono menu__colapsar" onClick={alternarColapsado}
            aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'} title={colapsado ? 'Expandir menú' : 'Contraer menú'}>
            {colapsado ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
          </button>
          <button className="boton-icono menu__cerrar" onClick={cerrarMenu} aria-label="Cerrar menú">
            <X size={22} />
          </button>
        </div>

        <nav className="menu__opciones">
          {opciones.map(({ ruta, texto, icono: Icono }) => (
            <NavLink key={ruta} to={ruta} end={ruta === '/'} onClick={cerrarMenu} title={colapsado ? texto : undefined}
              className={({ isActive }) => `menu__opcion ${isActive ? 'menu__opcion--activa' : ''}`}>
              <Icono size={20} strokeWidth={1.75} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="menu__usuario">
          <strong>{usuario.nombre} {usuario.apellidos}</strong>
          <span>{NOMBRE_CORTO_ROL[usuario.rol] || usuario.rol}</span>
          <button className="menu__opcion menu__salir" onClick={salir} title={colapsado ? 'Cerrar sesión' : undefined}>
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
