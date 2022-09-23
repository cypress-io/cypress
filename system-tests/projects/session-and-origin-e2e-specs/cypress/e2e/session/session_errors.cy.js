it('fails to create with failing command', () => {
  cy.once(() => {
    if (Cypress.env('SYSTEM_TESTS')) {
      cy.get(top.document).within(() => {
        cy.contains('.test', 'fails to create with failing command').as('test').click()
        cy.get('@test').within(() => {
          cy.get('.command-name-session').should('contain', 'session_1')
          .find('.reporter-tag').should('contain', 'failed')
        })
      })
    }
  })

  cy.session('session_1', () => {
    cy.get('does_not_exist')
  })
})
