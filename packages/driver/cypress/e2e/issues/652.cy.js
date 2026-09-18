// https://github.com/cypress-io/cypress/issues/652
describe('cy.visit to the same URL with different hashes', () => {
  before(() => {
    cy.visit('/fixtures/issue-652.html')
  })

  it('fires hashchange for each visit', () => {
    cy.visit('/fixtures/issue-652.html#one')
    cy.visit('/fixtures/issue-652.html#two')
    cy.visit('/fixtures/issue-652.html#three')

    cy.get('#visited')
    .should('contain', 'one')
    .should('contain', 'two')
    .should('contain', 'three')
  })
})
