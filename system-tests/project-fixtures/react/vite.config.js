import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  logLevel: 'silent',
  optimizeDeps: {
    // Explicitly include React dependencies to prevent race condition
    // where React module might not be fully loaded when tests execute.
    // This ensures React is pre-bundled before component tests run.
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  plugins: [react({ jsxRuntime: 'classic' })],
})
