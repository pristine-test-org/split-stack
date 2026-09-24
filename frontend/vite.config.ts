import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev the API runs separately (uvicorn on :8000); Vite forwards /api to it.
const apiTarget = process.env.API_URL ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
