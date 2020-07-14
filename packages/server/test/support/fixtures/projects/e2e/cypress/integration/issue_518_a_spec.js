// https://github.com/cypress-io/cypress/issues/518
describe('issue #518 A', () => {
  it('fails', () => {
    cy.visit('/does-not-exist.html')
  })

  it('does not run this because of failure', () => {
    cy.visit('/index.html')
  })
})
