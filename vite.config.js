import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      'components': path.resolve(__dirname, './components'),
      'lib': path.resolve(__dirname, './lib'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'radix-vendor': ['@radix-ui/react-navigation-menu', '@radix-ui/react-label', '@radix-ui/react-slot'],
        },
      },
    },
  },
  server: {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  },
})

