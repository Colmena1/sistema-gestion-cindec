# Frontend — Sistema CINDEC

Aplicación React + Vite (SPA) del Sistema Integral de Gestión de Capacitación y Certificación Digital para CINDEC. Consume la API del backend en `/api/v1`.

## Cómo correrlo

1. Encender el backend (`cd backend` → `npm run dev`, puerto 4000).
2. En otra terminal: `cd frontend` → `npm install` (solo la primera vez) → `npm run dev`.
3. Abrir `http://localhost:5173`.

En desarrollo, Vite reenvía las peticiones a `/api` hacia `http://localhost:4000` (ver `vite.config.js`).

## Estructura de `src/`

| Carpeta / archivo | Qué contiene |
|---|---|
| `main.jsx` | Punto de entrada: tipografía, estilos, rutas y sesión |
| `App.jsx` | Mapa de rutas (pantallas) |
| `index.css` | Estilos globales con los tokens de la guía de estilo (`docs/02-diseno/05-2-guia-de-estilo.md`) |
| `api/cliente.js` | Cliente HTTP central (axios): base `/api/v1`, token JWT y manejo de sesión expirada |
| `config/menu.js` | Opciones del menú lateral por rol (mapa de navegación, figura 16) |
| `context/SesionContext.jsx` | Usuario en sesión (en Sprint 0 es un usuario de demostración) |
| `layouts/LayoutPrincipal.jsx` | Menú lateral + contenido; en celular, menú con botón ☰ |
| `pages/` | Una página por pantalla del inventario de prototipos |
| `assets/` | Logo de CINDEC |
