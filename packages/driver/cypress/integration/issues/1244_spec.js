describe('issue 1244', () => {
  it('correctly redirects when target=_top', () => {
    cy.visit('/fixtures/issue-1244.html')
    cy.get('button').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })
})
