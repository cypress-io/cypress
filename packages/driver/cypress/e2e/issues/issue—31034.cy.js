// @see https://github.com/cypress-io/cypress/issues/31034
describe('issue #31034', { browser: '!webkit' }, () => {
  it('is able to run privileged commands when there is a em dash (—) in the spec name', () => {
    cy.visit('/fixtures/files-form.html')
    cy.get('#basic').selectFile('cypress/fixtures/valid.json')
  })
})
