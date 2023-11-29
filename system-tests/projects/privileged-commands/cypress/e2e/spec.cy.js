it('can run privileged commands with basic auth baseUrl', () => {
  cy.visit('/html')
  cy.exec('echo "hello"')
  cy.readFile('cypress/fixtures/example.json')
  cy.writeFile('cypress/_test-output/written.txt', 'contents')
  cy.task('return:arg', 'arg')
})
