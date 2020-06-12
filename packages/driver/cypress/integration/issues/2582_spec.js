it('rewrites frameElement on the AUT to be null', () => {
  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.window().its('frameElement').should('be.null')
})

it('does not rewrite frameElement if modifyObstructiveCode is false', () => {
  Cypress.config('modifyObstructiveCode', false)

  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.window().then((win) => {
    expect(win.frameElement).not.to.be.null
    expect(win.frameElement).to.eq(cy.state('$autIframe').get(0))
  })
})
