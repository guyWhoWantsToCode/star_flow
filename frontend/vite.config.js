import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { proxy: { '/starflow-api': {
    target: 'http://localhost:8000',
    ws: true,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/starflow-api/, ''),
  } } },
})
