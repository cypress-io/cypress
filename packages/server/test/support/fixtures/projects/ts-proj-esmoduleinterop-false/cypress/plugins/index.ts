/// <reference types="cypress" />

// https://github.com/cypress-io/cypress/issues/7575
// It is tested here because Cypress spec files and support/plugin files use different TypeScript settings.
// And we want to test if esModuleInterop can be overriden in support/plugin files.
import * as add from './add'

add(1, 2)

// Default Cypress plugin function
export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {

}
