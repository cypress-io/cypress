import { logInternal } from './utils'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Tabs until the result of fn is true
       */
      tabUntil(fn: ($el: JQuery) => boolean, limit?: number): Chainable<any>
    }
  }
}

export function tabUntil (fn: (el: JQuery<HTMLElement>) => boolean, limit: number = 10) {
  function _tabUntil (step: number) {
    return cy.tab().focused({ log: false }).then((el) => {
      const pass = fn(el)

      if (pass) {
        return el
      }

      if (step > limit) {
        throw new Error(`Unable to step to element in ${fn.toString()} in ${limit} steps`)
      }

      return _tabUntil(step + 1)
    })
  }

  return logInternal('tabUntil', () => {
    cy.get('body')

    return _tabUntil(0)
  })
}
