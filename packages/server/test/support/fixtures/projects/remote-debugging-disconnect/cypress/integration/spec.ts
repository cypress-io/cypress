describe('e2e remote debugging disconnect', () => {
  it('reconnects as expected', () => {
    // 1 probing connection and 1 real connection should have been made during startup
    cy.task('get:stats')
    .should('include', {
      totalConnectionCount: 2,
      currentConnectionCount: 1,
    })

    // now, kill all CDP sockets
    cy.task('kill:active:connections')

    // this will attempt to run a CDP command, realize the socket is dead, enqueue it,
    // and start the reconnection process
    cy.wrap(Cypress)
    // @ts-ignore
    .invoke('automation', 'remote:debugger:protocol', {
      command: 'Browser.getVersion',
    })
    .should('have.keys', ['protocolVersion', 'product', 'revision', 'userAgent', 'jsVersion'])

    // evidence of a reconnection:
    cy.task('get:stats')
    .should('include', {
      totalConnectionCount: 3,
      currentConnectionCount: 1,
    })
  })

  it('errors if CDP connection cannot be reestablished', () => {
    cy.task('destroy:server')
    cy.task('kill:active:connections')

    // this will cause a project-level error once we realize we can't talk to CDP anymore
    cy.wrap(Cypress)
    // @ts-ignore
    .invoke('automation', 'remote:debugger:protocol', {
      command: 'Browser.getVersion',
    })
  })
})
