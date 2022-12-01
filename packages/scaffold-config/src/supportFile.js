'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.supportFileComponent = exports.supportFileE2E = void 0

const tslib_1 = require('tslib')
const dedent_1 = tslib_1.__importDefault(require('dedent'))

function supportFileE2E (language) {
  return (0, dedent_1.default) `
    // ***********************************************************
    // This example support/e2e.${language} is processed and
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
  `
}
exports.supportFileE2E = supportFileE2E

function supportFileComponent (language, mountModule) {
  const supportFileTemplate = (0, dedent_1.default) `
    // ***********************************************************
    // This example support/component.${language} is processed and
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
  `
  const exampleUse = (0, dedent_1.default) `
    // Example use:
    // cy.mount(${mountModule.includes('cypress/react') ? '<MyComponent />' : 'MyComponent'})
  `
  const NEWLINE = '\n\n'

  if (language === 'ts') {
    const registerMount = (0, dedent_1.default) `
      import { mount } from '${mountModule}'

      // Augment the Cypress namespace to include type definitions for
      // your custom command.
      // Alternatively, can be defined in cypress/support/component.d.ts
      // with a <reference path="./component" /> at the top of your spec.
      declare global {
        namespace Cypress {
          interface Chainable {
            mount: typeof mount
          }
        }
      }

      Cypress.Commands.add('mount', mount)
    `

    return [supportFileTemplate, registerMount, exampleUse].join(NEWLINE)
  }

  const registerMount = (0, dedent_1.default) `
    import { mount } from '${mountModule}'

    Cypress.Commands.add('mount', mount)
  `

  return [supportFileTemplate, registerMount, exampleUse].join(NEWLINE)
}
exports.supportFileComponent = supportFileComponent
