import '@percy/cypress'
import type { ComponentPublicInstance } from 'vue'

// Add cy.mount, cy.mountFragment, cy.mountFragmentList
export * from './mock-graphql/mountFragment'

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
      vue<T extends ComponentPublicInstance>(componentToFind?: (new () => T) | null): Cypress.Chainable<any>
    }
  }
}

import { initHighlighter } from '@cy/components/ShikiHighlight.vue'

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
// @ts-ignore
initHighlighter()
