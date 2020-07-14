// https://github.com/cypress-io/cypress/issues/518
describe('issue #518 B', () => {
  it('does not run this because of failure in the previous spec', () => {
    cy.visit('/index.html')
  })
})
