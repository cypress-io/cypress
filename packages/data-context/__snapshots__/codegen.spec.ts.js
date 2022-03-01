exports['cypress.config.js generation should create a string when passed only a global option 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 300,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should create a string when passed only a e2e options 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'localhost:3000',
  },
})

`

exports['cypress.config.js generation should create a string when passed only a component options 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should create a string for a config with global, component, and e2e options 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 300,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
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
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should handle export default in plugins file 1'] = `
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config)
    },
  },
})

`

exports['cypress.config.js generation should exclude fields that are no longer valid 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
})

`
