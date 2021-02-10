import path from 'path'

import reactRefresh from '@vitejs/plugin-react-refresh'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase',
      scopeBehaviour: 'local',
      generateScopedName: '[hash:base64:8]',
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.tsx'),
      name: 'CypressWalnut'
    },
    rollupOptions: {
      external: ['react-dom'],
      output: {
      }
    }
  },
  plugins: [reactRefresh()]
})
