// https://github.com/cypress-io/cypress/issues/14864
describe('keyup is deferred until input handler microtasks run', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-14864.html')
  })

  it('provides feedback when typing slash after input handler updates value asynchronously', () => {
    cy.get('input').type('/')
    cy.get('#feedback').should('have.text', 'You typed Slash')
  })
})
