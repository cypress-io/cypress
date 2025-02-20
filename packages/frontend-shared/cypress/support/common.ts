import '../../src/styles/shared.scss'
import type { ComponentPublicInstance } from 'vue'
import { configure } from '@testing-library/cypress'

// Add cy.mount, cy.mountFragment, cy.mountFragmentList
export * from './mock-graphql/mountFragment'

configure({ testIdAttribute: 'data-cy' })

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

// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these tsconfig compiler paths
import { initHighlighter } from '@cy/components/highlight'

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
await initHighlighter()
