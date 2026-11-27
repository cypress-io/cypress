describe('privileged commands after the primary origin changes', () => {
  it('runs on the first primary origin', () => {
    cy.visit('http://localhost:3500/fixtures/generic.html')
    cy.task('return:arg', 'arg').should('equal', 'arg')
  })

  it('runs on a new primary origin', () => {
    cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
    cy.task('return:arg', 'arg').should('equal', 'arg')
    cy.readFile('cypress/fixtures/app.json').its('some').should('equal', 'json')
  })
})
