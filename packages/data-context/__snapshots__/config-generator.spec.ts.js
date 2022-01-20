exports['migration utils should create a string when passed only a global option 1'] = `
const { defineConfig } = require('cypress')

module.export = defineConfig({
  visualViewport: 300,
})
`

exports['migration utils should create a string when passed an empty object 1'] = `
const { defineConfig } = require('cypress')

module.export = defineConfig({
  
})
`

exports['migration utils should create a string when passed only a e2e options 1'] = `
const { defineConfig } = require('cypress')

module.export = defineConfig({
  
  e2e: {
    setupNodeEvents(on, config) {
      return require('/cypress/plugins/index.js')
    },
    baseUrl: 'localhost:3000'
  },
})
`

exports['migration utils should create a string for a config with global, component, and e2e options 1'] = `
const { defineConfig } = require('cypress')

module.export = defineConfig({
  visualViewport: 300,
  e2e: {
    setupNodeEvents(on, config) {
      return require('/cypress/plugins/index.js')
    },
    baseUrl: 'localhost:300',
    retries: 2
  },
  component: {
    setupNodeEvents(on, config) {
      return require('/cypress/plugins/index.js')
    },
    retries: 1
  },
})
`

exports['migration utils should create a string when passed only a component options 1'] = `
const { defineConfig } = require('cypress')

module.export = defineConfig({
  
  component: {
    setupNodeEvents(on, config) {
      return require('/cypress/plugins/index.js')
    },
    retries: 2
  },
})
`

exports['migration utils should exclude fields that are no longer valid 1'] = `
const { defineConfig } = require('cypress')

module.export = defineConfig({
  
})
`
