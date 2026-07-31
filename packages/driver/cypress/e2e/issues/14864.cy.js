// https://github.com/cypress-io/cypress/issues/14864
describe('issue #14864 - keyup deferred after input microtasks', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-14864.html')
  })

  it('provides feedback when typing slash after input handler updates value asynchronously', () => {
    cy.get('input').type('/')
    cy.get('#feedback').should('have.text', 'You typed Slash')
  })
})
