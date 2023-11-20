const callAutomation = () => {
  return Cypress.automation('remote:debugger:protocol', {
    command: 'Browser.getVersion',
  })
}

describe('e2e remote debugging disconnect', () => {
  it('reconnects as expected', () => {
    // 1 probing connection and 1 real connection should have been made during startup
    cy.task('get:stats')
    .should('include', {
      totalConnectionCount: 4,
      currentConnectionCount: 2,
    })

    // now, kill all CDP sockets
    cy.task('kill:active:connections')
    cy.then(() => {
      const onRetry = () => {
        return callAutomation().catch(() => cy.retry(onRetry, {}))
      }

      return onRetry()
    })

    // TODO: We're only reconnecting the page client. See if we can find a way to reconnect the browser client
    // evidence of a reconnection:
    cy.task('get:stats')
    .should('include', {
      totalConnectionCount: 6,
      currentConnectionCount: 1,
    })
  })
})
