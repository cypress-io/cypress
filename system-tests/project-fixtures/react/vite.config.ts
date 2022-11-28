import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      'react': require.resolve('react'),
      'react-dom/client': require.resolve('react-dom/client'),
      'react-dom': require.resolve('react-dom'),
    },
  },
  logLevel: 'silent',
})
