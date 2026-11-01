describe('remote driver: window in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.window()', () => {
    cy.visit('http://www.foobar.com:3500/fixtures/remote-driver-isolation.html')
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('log')
    })

    cy.get('#log').click()
    cy.get('@log').should('have.been.calledWith', 'app log')
  })

  it('.document()', () => {
    cy.document().its('charset').should('eq', 'UTF-8')
  })

  it('.title()', () => {
    cy.title().should('include', 'DOM Fixture')
  })
})
