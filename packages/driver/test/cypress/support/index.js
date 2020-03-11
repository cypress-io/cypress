// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your other test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/guides/configuration#section-global
// ***********************************************************

// Alternatively you can use CommonJS syntax:
// require("./commands")

// trick cypress run-mode into thinking it's in open-mode
// this allows us to test properties of UI like snapshots, logs, etc.
Cypress.config().numTestsKeptInMemory = 1
const _isInteractive = Cypress.config().isInteractive

beforeEach(() => {
  Cypress.config().isInteractive = true
})

afterEach(() => {
  Cypress.config().isInteractive = _isInteractive
})
