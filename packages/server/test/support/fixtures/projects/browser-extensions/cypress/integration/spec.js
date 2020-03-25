context('before:browser:launch extension e2e', () => {
  it('has the expected extension', () => {
    if (Cypress.browser.name === 'electron') {
      cy.wrap(window.top).its('theExtensionLoaded').should('be.true')

      return
    }

    cy.visit('/index.html')
    .get('#extension')
    .should('contain', 'inserted from extension!')
  })
})
