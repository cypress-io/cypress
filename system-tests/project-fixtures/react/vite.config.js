import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  mode: 'production',
  logLevel: 'silent',
  plugins: [react({ jsxRuntime: 'classic' })],
})
