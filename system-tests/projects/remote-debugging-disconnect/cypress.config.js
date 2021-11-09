module.exports = {
  e2e: {
    setupNodeEvents (on, config) {
      const plugins = require('./plugins')

      return plugins(on, config)
    },
  },
}
