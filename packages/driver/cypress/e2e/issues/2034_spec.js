// https://github.com/cypress-io/cypress/issues/2034
describe('issue 2034', () => {
  it('does not error with "offset out of range" when taking screenshot', () => {
    cy.visit('/fixtures/issue-2034.html')
    cy.get('#blue').screenshot()
  })
})
