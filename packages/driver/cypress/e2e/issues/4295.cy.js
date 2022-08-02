// https://github.com/cypress-io/cypress/issues/4295
it('rewrites document.referrer on the AUT to be empty string on visit', () => {
  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.window().its('document').its('referrer').should('equal', '')
})

it('rewrites document.referrer on the AUT to be empty string on visit before user calls onBeforeLoad', () => {
  cy.visit('http://localhost:3500/fixtures/generic.html', { onBeforeLoad: (contentWindow) => {
    expect(contentWindow.document.referrer).to.equal('')
  } })
})

it('does not rewrite document.referrer if navigation was triggered by click on a link', () => {
  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.get('#dimensions').click()

  cy.window().its('document').its('referrer').should('equal', 'http://localhost:3500/fixtures/generic.html')
})
