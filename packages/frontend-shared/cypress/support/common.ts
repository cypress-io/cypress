// Add cy.mount, cy.mountFragment, cy.mountFragmentList
export * from './mock-graphql/mountFragment'

import type { Component } from 'vue'

export function addVueCommand () {
  Cypress.Commands.add('vue', (componentToFind = null) => {
    if (componentToFind) {
      return cy.wrap(Cypress.vueWrapper.findComponent(componentToFind))
    }

    return cy.wrap(Cypress.vueWrapper)
  })
}

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
