import {
  House, Users, BookOpen, Layers, UserRound, ClipboardList, Award,
  ChartColumn, ShieldCheck, FolderOpen, ClipboardCheck, History, FileBadge,
} from 'lucide-react'

// Opciones del menú lateral (mapa de navegación, figura 16).
// "pantalla" es el ID del inventario de prototipos y "sprint" cuándo se construye.
const OP = {
  inicio:       { ruta: '/', texto: 'Inicio', icono: House, pantalla: 'P-04', sprint: 0 },
  usuarios:     { ruta: '/usuarios', texto: 'Usuarios', icono: Users, pantalla: 'P-05', sprint: 1 },
  cursos:       { ruta: '/cursos', texto: 'Cursos y estándares', icono: BookOpen, pantalla: 'P-06', sprint: 2 },
  grupos:       { ruta: '/grupos', texto: 'Grupos', icono: Layers, pantalla: 'P-07', sprint: 2 },
  participantes:{ ruta: '/participantes', texto: 'Participantes', icono: UserRound, pantalla: 'P-10', sprint: 2 },
  instrumentos: { ruta: '/instrumentos', texto: 'Instrumentos de evaluación', icono: ClipboardList, pantalla: 'P-12', sprint: 3 },
  tramites:     { ruta: '/tramites', texto: 'Trámites', icono: Award, pantalla: 'P-13', sprint: 3 },
  reportes:     { ruta: '/reportes', texto: 'Reportes', icono: ChartColumn, pantalla: 'P-15', sprint: 4 },
  misGrupos:    { ruta: '/mis-grupos', texto: 'Mis grupos', icono: Layers, pantalla: 'P-16', sprint: 2 },
  materiales:   { ruta: '/materiales', texto: 'Materiales', icono: FolderOpen, pantalla: 'P-18 / P-22', sprint: 3 },
  porEvaluar:   { ruta: '/por-evaluar', texto: 'Por evaluar', icono: ClipboardCheck, pantalla: 'P-19', sprint: 3 },
  misCursos:    { ruta: '/mis-cursos', texto: 'Mis cursos', icono: BookOpen, pantalla: 'P-21', sprint: 2 },
  miHistorial:  { ruta: '/mi-historial', texto: 'Mi historial', icono: History, pantalla: 'P-23', sprint: 2 },
  misCertificados: { ruta: '/mis-certificados', texto: 'Mis certificados', icono: FileBadge, pantalla: 'P-24', sprint: 3 },
  verificar:    { ruta: '/verificar-folio', texto: 'Verificar folio', icono: ShieldCheck, pantalla: 'P-25', sprint: 3 },
}

const COORDINADOR = [OP.inicio, OP.cursos, OP.grupos, OP.participantes, OP.instrumentos, OP.tramites, OP.reportes, OP.verificar]

// Menú de cada rol. El Administrador ve lo del Coordinador más Usuarios.
export const MENU_POR_ROL = {
  'Administrador general': [OP.inicio, OP.usuarios, ...COORDINADOR.slice(1)],
  Coordinador: COORDINADOR,
  Instructor: [OP.inicio, OP.misGrupos, OP.materiales, OP.verificar],
  Evaluador: [OP.inicio, OP.porEvaluar, OP.verificar],
  Participante: [OP.inicio, OP.misCursos, OP.materiales, OP.miHistorial, OP.misCertificados, OP.verificar],
}

export const ROLES = Object.keys(MENU_POR_ROL)
export const TODAS_LAS_OPCIONES = Object.values(OP)
