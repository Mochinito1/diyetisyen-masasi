import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages adresi: https://<kullanici>.github.io/diyetisyen-masasi/
export default defineConfig({
  base: '/diyetisyen-masasi/',
  plugins: [react(), tailwindcss()],
})