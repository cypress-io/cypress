module.exports = {
  'e2e': {
    setupNodeEvents (on, config) {
      config.specPattern = 'cypress/e2e/a_record.cy.js'

      return config
    },
  },
}
