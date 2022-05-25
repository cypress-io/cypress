describe('issue #599', () => {
  it('does not error when attempting to redefine onreadystatechange', () => {
    cy.visit('/fixtures/issue-599.html')
    cy.contains('xhr test').click()
    cy.contains('xhr test').click()
  })
})
