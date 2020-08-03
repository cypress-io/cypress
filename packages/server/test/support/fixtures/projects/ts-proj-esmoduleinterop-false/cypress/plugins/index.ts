/// <reference types="cypress" />

// https://github.com/cypress-io/cypress/issues/7575
import * as add from './add'

// if esModuleInterop is forced to be true, this will error // with 'add is
// not a function'. instead, we allow the tsconfig.json to determine the value
// of esModuleInterop
add(1, 2)

// Default Cypress plugin function
export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {

}
