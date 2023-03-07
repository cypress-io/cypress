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
  component: {
    setupNodeEvents(on, config) {},
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
  component: {
    setupNodeEvents(on, config) {},
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
  component: {
    setupNodeEvents(on, config) {},
    retries: 2,
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
    slowTestThreshold: 500,
  },
  component: {
    setupNodeEvents(on, config) {},
    retries: 1,
    slowTestThreshold: 500,
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
  component: {
    setupNodeEvents(on, config) {},
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
      return require('./cypress/plugins/index.ts').default(on, config)
    },
  },
  component: {
    setupNodeEvents(on, config) {},
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
  component: {
    setupNodeEvents(on, config) {},
    specPattern: 'path/to/component/folder/**/*.cy.{js,jsx,ts,tsx}',
  },
})

`

exports['cypress.config.js generation should create only a component entry when no e2e specs are detected 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    setupNodeEvents(on, config) {},
  },
})

`

exports['cypress.config.js generation should create only an e2e entry when no component specs are detected 1'] = `
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

exports['cypress.config.js generation should maintain both root level and nested non-breaking options during migration 1'] = `
import { defineConfig } from 'cypress'

export default defineConfig({
  viewportWidth: 1200,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    viewportWidth: 1600,
  },
  component: {
    setupNodeEvents(on, config) {},
    viewportWidth: 400,
  },
})

`

exports['cypress.config.js generation should add custom specPattern if project has projectId 1'] = `
import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'abc1234',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
  component: {
    setupNodeEvents(on, config) {},
  },
})

`

exports['cypress.config.js generation should not add custom specPattern if project has projectId and integrationFolder 1'] = `
import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'abc1234',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/custom/e2e/**/*.{js,jsx,ts,tsx}',
  },
  component: {
    setupNodeEvents(on, config) {},
  },
})

`

exports['cypress.config.js generation generates correct config for component testing migration with custom testFiles glob 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    setupNodeEvents(on, config) {},
    specPattern: './**/*.spec.cy.{js,ts,jsx,tsx}',
  },
})

`

exports['cypress.config.js generation should create a string when passed an empty object for an ECMA Script project 1'] = `
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
  },
  component: {
    setupNodeEvents(on, config) {},
  },
})

`

exports['cypress.config.js generation generates correct config for component testing migration with custom testFiles array of glob 1'] = `
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
    specPattern: ['cypress/e2e/**/*.spec.js', 'cypress/e2e/**/*.test.js'],
  },
})

`
