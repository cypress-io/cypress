// https://github.com/cypress-io/cypress/issues/6412

describe('issue #6412: Illegal invocation when global parent defined', () => {
  it('does not throw - clicks element', () => {
    cy.visit('/fixtures/global_parent_definition.html')
    cy.get('.foo').click()
  })
})
