const {defineConfig} = require('vite')

module.exports = defineConfig({
  resolve: {
    alias: {
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    },
  },
  logLevel: 'silent'
})