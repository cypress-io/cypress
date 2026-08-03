describe('window.name regression (#34435)', () => {
  it('reads the AUT URL after window.name is overwritten', () => {
    cy.visit('/')
    cy.contains('AUT').should('be.visible')

    // On Cypress 15.19.0 in Chrome this fails: cy.url() returns "about:blank"
    // because Cypress selects the reporter iframe instead of the AUT iframe.
    // On 15.18.1 it passes.
    cy.url().should('eq', 'http://127.0.0.1:12345/')
  })
})
