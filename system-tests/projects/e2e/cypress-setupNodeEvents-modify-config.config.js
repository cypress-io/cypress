module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      config.specPattern = 'cypress/e2e/*-spec.js'

      return config
    },
  },
}
