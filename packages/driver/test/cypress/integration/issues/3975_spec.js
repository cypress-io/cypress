// https://github.com/cypress-io/cypress/issues/3975
describe('issue 3975', function () {
  it('AUT can navigate using location.href with a relative URI', function () {
    cy.visit('http://localhost:3500/fixtures/nested/issue-3975.html?foop=54707:LOGIN_DESKTOP')
    .location()
    .its('search')
    .should('contain', '?bar')
  })

  it('from issue', function () {
    cy.visit('https://apex.oracle.com/pls/apex/f?p=54707:LOGIN_DESKTOP')
    // cy.pause()
    cy.get('#P9999_USERNAME').type('ApexUser')
    cy.get('#P9999_PASSWORD').type('Oradoc_db1')
    cy.get('.t-Button').click()
    cy.url().should('contain', 'https://apex.oracle.com/pls/apex/f?p=54707:1')
  })
})
