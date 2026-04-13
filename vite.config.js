import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    host: true, // Same WiFi mobile testing: http://192.168.x.x:3000
    strictPort: true,

    // 🔥 PROXY CONFIG (Backend connection for Dev)
    proxy: {
      '/api': {
        target: 'http://16.171.165.109:5001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://16.171.165.109:5001',
        ws: true,
        changeOrigin: true
      }
    }
  },

  preview: {
    port: 3000
  },

  build: {
    outDir: 'dist',
    sourcemap: false, // Security: Hide source code in production
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },

    chunkSizeWarningLimit: 1200
  }
})