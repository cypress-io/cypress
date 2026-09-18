// https://github.com/cypress-io/cypress/issues/599
describe('redefining XHR onreadystatechange', () => {
  it('does not error when attempting to redefine onreadystatechange', () => {
    cy.visit('/fixtures/issue-599.html')
    cy.contains('xhr test').click()
    cy.contains('xhr test').click()
  })
})
