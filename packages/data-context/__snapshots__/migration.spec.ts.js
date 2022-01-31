exports['cypress.config.js generation should create a string when passed only a global option 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 300,
  e2e: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.js')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should create a string when passed only a e2e options 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'localhost:3000',
  },
})

`

exports['cypress.config.js generation should create a string when passed only a component options 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.js')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should create a string for a config with global, component, and e2e options 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 300,
  e2e: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.js')(on, config)
    },
    retries: 2,
    baseUrl: 'localhost:300',
  },
})

`

exports['cypress.config.js generation should create a string when passed an empty object 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.js')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should exclude fields that are no longer valid 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return require('path/to/plugin/file')(on, config)
    },
  },
})

`
