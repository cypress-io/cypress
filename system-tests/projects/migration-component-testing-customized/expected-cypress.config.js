const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    setupNodeEvents (on, config) {},
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
  },
})
