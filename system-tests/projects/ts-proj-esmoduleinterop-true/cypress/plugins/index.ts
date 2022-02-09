/// <reference types="cypress" />

import commonjsExports from './commonjs-export'

if (commonjsExports.export1 !== 'export1' || commonjsExports.export2 !== 'export2') {
  throw new Error('Imported values do not match exported values')
}

// Default Cypress plugin function
export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {

}
