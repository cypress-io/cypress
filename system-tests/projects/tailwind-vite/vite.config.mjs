import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function resolvePackage (specifier) {
  return fileURLToPath(import.meta.resolve(specifier))
}

export default defineConfig({
  logLevel: 'silent',
  optimizeDeps: {
    // Pre-bundle React deps so they are ready when the iframe loads support/spec files.
    include: ['react', 'react-dom/client', 'react-dom'],
  },
  resolve: {
    // Force a single React instance so the adapter (cypress/react) and spec files use the same React.
    alias: {
      'react': resolvePackage('react'),
      'react-dom/client': resolvePackage('react-dom/client'),
      'react-dom': resolvePackage('react-dom'),
    },
  },
  plugins: [tailwindcss(), react({ jsxRuntime: 'classic' })],
})
