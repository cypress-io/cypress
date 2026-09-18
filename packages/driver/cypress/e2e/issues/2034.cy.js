// https://github.com/cypress-io/cypress/issues/2034
describe('element screenshot', () => {
  it('does not error with "offset out of range" when taking screenshot', () => {
    cy.visit('/fixtures/issue-2034.html')
    cy.get('#blue').screenshot()
  })
})
