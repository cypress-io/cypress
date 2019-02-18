/*
Before All
- Load and cache UMD modules specified in fixtures/modules.json
  These scripts are inlined in the document during unit tests
  modules.json should be an array, which implicitly sets the loading order
  Format: [{name, type, location}, ...]
*/
before(() => {
  Cypress.modules = []
  cy.log('Initializing UMD module cache')
    .fixture('modules')
    .then((modules = []) => {
      for (const module of modules) {
        let { name, type, location } = module
        cy.log(`Loading ${name} via ${type}`)
          .readFile(location)
          .then(source => Cypress.modules.push({ name, type, location, source }))
      }
    })
})

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')
