import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        // Main process entry
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: [
                'electron',
                'better-sqlite3',
                'electron-updater',
              ],
            },
          },
        },
      },
      {
        // Preload script entry
        entry: 'src/preload/preload.ts',
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
        onstart(options) {
          // Notify the renderer process to reload when preload changes
          options.reload()
        },
      },
    ]),
    // Enable Node.js API in the renderer process (for preload bridge)
    renderer(),
  ],
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
