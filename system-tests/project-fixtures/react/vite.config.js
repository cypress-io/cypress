import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  logLevel: 'silent',
  plugins: [react({ jsxRuntime: 'classic' })],
  optimizeDeps: {
    // users 99% of the time want this option enabled but we want consistent snapshots without optimized dependency messages printed to the console
    // that are not suppressed by logLevel='silent'
    noDiscovery: true,
  },
})
