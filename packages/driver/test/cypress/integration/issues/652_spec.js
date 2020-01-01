// https://github.com/cypress-io/cypress/issues/652
describe('issue 652', () => {
  before(() => {
    cy.visit('/fixtures/issue-652.html')
  })

  it('should visit all the hashes', () => {
    // cy.wait(0)
    cy.visit('/fixtures/issue-652.html#one')
    // cy.wait(0)
    cy.visit('/fixtures/issue-652.html#two')
    // cy.wait(0)
    cy.visit('/fixtures/issue-652.html#three')

    cy.get('#visited')
    .should('contain', 'one')
    .should('contain', 'two')
    .should('contain', 'three')
  })
})
