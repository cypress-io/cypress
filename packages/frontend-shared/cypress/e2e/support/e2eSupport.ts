import type { DataContext } from '@packages/data-context'

const SIXTY_SECONDS = 60 * 1000

declare global {
  namespace Cypress {
    interface Chainable {
      withCtx(fn: (ctx: DataContext) => any): Chainable
    }
  }
}

Cypress.Commands.add('withCtx', (fn) => {
  const _log = Cypress.log({
    name: 'withCtx',
    message: '(view in console)',
    consoleProps () {
      return {
        'Executed': fn.toString(),
      }
    },
  })

  cy.task('withCtx', fn.toString(), { timeout: SIXTY_SECONDS, log: false }).then(() => {
    _log.end()
  })
})
