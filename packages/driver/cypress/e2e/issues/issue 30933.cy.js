// @see https://github.com/cypress-io/cypress/issues/30933
describe('issue #30933', { browser: '!webkit' }, () => {
  it('is able to run privileged commands when there is a space in the spec name', () => {
    cy.visit('/fixtures/files-form.html')
    cy.get('#basic').selectFile('cypress/fixtures/valid.json')
  })
})
