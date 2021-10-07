import type { DataContext } from '@packages/data-context'

declare global {
  namespace Cypress {
    interface Chainable {
      withCtx(fn: (ctx: DataContext) => any): Chainable
    }
  }
}

Cypress.Commands.add('withCtx', (fn) => {
  cy.task('withCtx', fn.toString())
})
