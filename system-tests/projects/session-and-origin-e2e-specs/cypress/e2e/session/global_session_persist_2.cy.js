it('restores global_1 session from last test', async () => {
  cy.login('global_1')

  if (Cypress.env('SYSTEM_TESTS')) {
    cy.get(top.document).within(() => {
      cy.contains('.test', 'creates global session').as('restores_global_session').click()
      cy.get('@restores_global_session').within(() => {
        cy.get('.command-name-session').should('contain', 'global_1')
        .find('.reporter-tag').should('contain', 'restored')
      })
    })
  }

  cy.getCookie('token').then((cookie) => {
    expect(cookie.value).to.eq('1')
  })
})
