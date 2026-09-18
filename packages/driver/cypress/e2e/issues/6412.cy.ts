// https://github.com/cypress-io/cypress/issues/6412

describe('AUT that defines a global named parent', () => {
  it('clicks an element without an Illegal invocation error', () => {
    cy.visit('/fixtures/global_parent_definition.html')
    cy.get('.foo').click()
  })
})
