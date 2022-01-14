// https://github.com/cypress-io/cypress/issues/8279
describe('issue 8279', () => {
  it('can click button inside large div with tabindex=0 without scrolling', () => {
    cy.visit('/fixtures/issue-8279.html')
    cy.get('#clickme').click()
  })
})
