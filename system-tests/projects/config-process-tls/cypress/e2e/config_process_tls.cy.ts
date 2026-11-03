const expectedOutcome = Cypress.expose('verifiesCertificates') ? /^refused: / : /^connected$/

it('applies the user\'s NODE_TLS_REJECT_UNAUTHORIZED to the config process', () => {
  cy.task('nodeTlsRejectUnauthorized').should('equal', Cypress.expose('nodeTlsRejectUnauthorized') ?? null)
})

it('applies it to https requests', () => {
  cy.task('httpsGet').should('match', expectedOutcome)
})

it('applies it to fetch requests', () => {
  cy.task('fetch').should('match', expectedOutcome)
})
