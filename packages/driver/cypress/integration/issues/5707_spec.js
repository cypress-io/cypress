// https://github.com/cypress-io/cypress/issues/5707
describe('issue 5707', () => {
  it('calls setTimeout with the correct context', () => {
    cy.visit('/fixtures/issue-5707.html')
    cy.window().its('foo').should('eq', 'bar')
  })
})
