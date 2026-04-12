import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      target: 'esnext',
      sourcemap: false, // no source maps in prod (smaller bundle, fewer leaks)
      chunkSizeWarningLimit: 1000, // raise warning threshold to 1MB
      rollupOptions: {
        // control how chunks are output
        output: {
          manualChunks: {
            react: ['react', 'react-dom'], // put React core in its own chunk
            router: ['react-router-dom'], // isolate the router for caching/lazy routes
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'] // group MUI
          }
        }
      }
    }
  }
})
