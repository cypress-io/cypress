// https://github.com/cypress-io/cypress/issues/26206
describe('issue 26206', () => {
  beforeEach(() => {
    cy.visit('fixtures/issue-26206.html')
  })

  it('removeAttribute works for non-target attributes after handleInvalidTarget', () => {
    // After clicking an anchor with target="_top", the handleInvalidTarget function
    // patches the element's removeAttribute. The bug was that removeAttribute
    // would not work for attributes other than 'target'.
    cy.get('#link').click()
    cy.get('#result').should('have.text', 'removed')
  })
})
