module.exports = {
  'e2e': {
    'supportFile': false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents (on, config) {
      on('file:preprocessor', () => '/does/not/exist.js')

      return config
    },
  },
}
