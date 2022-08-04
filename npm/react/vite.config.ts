import { defineConfig } from 'vite'
import replace from '@rollup/plugin-replace'
import reactPlugin from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    replace({
     values: {
        'process.env': `(process.env || {})`,
      }, 
    }),
    reactPlugin({
      jsxRuntime: 'classic',
    }),
  ],
})
