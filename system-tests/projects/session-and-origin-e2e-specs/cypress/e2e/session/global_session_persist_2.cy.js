it('restores global_1 session from last test', async () => {
  cy.login('global_1')

  if (Cypress.env('SYSTEM_TESTS')) {
    cy.wrap(null).should(() => {
      expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('restored')
    })
  }

  cy.visit('/cypress/fixtures/home.html')
  cy.getCookie('token').then((cookie) => {
    expect(cookie.value).to.eq('1')
  })
})
