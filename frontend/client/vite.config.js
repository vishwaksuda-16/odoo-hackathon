import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/users': 'http://localhost:5000',
      '/vehicle': 'http://localhost:5000',
      '/driver': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/maintenance': 'http://localhost:5000',
      '/analytics': 'http://localhost:5000',
      '/alerts': 'http://localhost:5000',
      '/export': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
})
