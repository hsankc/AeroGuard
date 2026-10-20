import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Tek dosya çıktı: dist/index.html internetsiz (USB'den) açılabilir.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
  },
})
