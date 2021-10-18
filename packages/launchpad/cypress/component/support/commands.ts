import { registerMountFn } from '@packages/frontend-shared/cypress/support/common'

import type { Component } from 'vue'

registerMountFn()

Cypress.Commands.add('vue', (componentToFind = null) => {
  if (componentToFind) {
    return cy.wrap(Cypress.vueWrapper.findComponent(componentToFind))
  }

  return cy.wrap(Cypress.vueWrapper)
})

declare global {
    namespace Cypress {
      interface Chainable {
        /**
         * return Vue Test Utils wrapper wrapped in a cypress chainable
         */
        vue(componentToFind?: Component): Cypress.Chainable<any>
      }
    }
  }
