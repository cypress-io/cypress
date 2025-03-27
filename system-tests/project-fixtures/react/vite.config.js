const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
  logLevel: 'silent',
  plugins: [react({ jsxRuntime: 'classic' })],
})
