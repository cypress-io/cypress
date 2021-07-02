// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import { mount } from '@cypress/vue'
import { VClickOutside } from '../../src/plugins/ClickOutside'
import { createStore, Store } from '../../src/store'

Cypress.Commands.add(
  'mount',
  (comp: Parameters<typeof mount>[0], options: Parameters<typeof mount>[1]) => {
    const store = createStore()

    Cypress.store = store

    options = options || {}
    options.global = options.global || {}

    options.global.directives = options.global.directives || {}
    options.global.directives['click-outside'] = VClickOutside

    options.global.plugins = options.global.plugins || []
    options.global.plugins.push(store)

    return mount(comp, options)
  },
)

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Install all vue plugins and globals then mount
       */
      mount: typeof mount
    }
    interface Cypress {
      store: Store
    }
  }
}
