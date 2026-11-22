describe('privileged commands without a baseUrl', { baseUrl: null }, () => {
  beforeEach(() => {
    cy.visit('cypress/fixtures/index.html')
  })

  it('runs cy.task', () => {
    cy.task('return:arg', 'arg').should('equal', 'arg')
  })

  it('runs cy.readFile', () => {
    cy.readFile('cypress/fixtures/app.json').its('name').should('equal', 'Ishmael')
  })

  it('runs cy.origin', { browser: '!webkit' }, () => {
    cy.origin(`http://127.0.0.1:${Cypress.expose('appServerPort')}`, () => {
      cy.visit('/')
      cy.contains('Ahab')
    })
  })
})
