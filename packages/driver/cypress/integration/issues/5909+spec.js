// https://github.com/cypress-io/cypress/issues/5909
describe('issue 5909', () => {
  it('runs specs with name containing "+"', () => {
    cy.visit('/fixtures/issue+5909.html')
  })
})
