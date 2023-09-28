describe('e2e headless old spec', function () {
  it('has expected launch args', function () {
    if (Cypress.isBrowser({ family: 'chromium' }) && Cypress.browserMajorVersion() >= 119) {
      cy.fail('headless old is supported in Chromium >= 119, please update this system test.')
    }

    cy.task('get:browser:args').should('contain', '--headless=old')
  })
})
