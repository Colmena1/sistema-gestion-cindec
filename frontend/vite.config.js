import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En desarrollo, toda petición a /api se reenvía al backend (puerto 4000).
    // Así React y la API parecen estar en la misma dirección, igual que en la
    // implementación final en CINDEC, donde Express sirve ambos (Diseño, cap. 2).
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
