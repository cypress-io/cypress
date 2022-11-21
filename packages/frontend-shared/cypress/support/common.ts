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

export function logInternal<T> (name: string | Partial<Cypress.LogConfig>, cb: (log: Cypress.Log | undefined) => Cypress.Chainable<T>, opts: Partial<Cypress.Loggable> = {}): Cypress.Chainable<T> {
  const _log = typeof name === 'string'
    ? Cypress.log({ name, message: '' })
    : Cypress.log(name)

  return cb(_log).then<T>((val) => {
    _log?.end()

    return val
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

import { initHighlighter } from '@cy/components/highlight'

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
// @ts-ignore
initHighlighter()
