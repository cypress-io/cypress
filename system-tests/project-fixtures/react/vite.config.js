import { createRequire } from 'module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)

export default defineConfig({
  logLevel: 'silent',
  optimizeDeps: {
    // Pre-bundle React deps so they are ready when the iframe loads support/spec files.
    include: ['react', 'react-dom/client', 'react-dom'],
  },
  resolve: {
    // Force a single React instance so the adapter (cypress/react) and spec files use the same React.
    alias: {
      'react': require.resolve('react'),
      'react-dom/client': require.resolve('react-dom/client'),
      'react-dom': require.resolve('react-dom'),
    },
  },
  plugins: [react({ jsxRuntime: 'classic' })],
})
