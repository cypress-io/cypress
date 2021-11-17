module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      const path = require('path')

      on('file:preprocessor', () => {
        return path.join(__dirname, './cypress/integration/another_spec.js')
      })

      return config
    },
  },
}
