/// <reference types="cypress" />

import * as fn from './commonjs-export-function'

// if esModuleInterop is forced to be true, this will error // with 'fn is
// not a function'. instead, we allow the tsconfig.json to determine the value
// of esModuleInterop
fn()

// Default Cypress plugin function
export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {

}
