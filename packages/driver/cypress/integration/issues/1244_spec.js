describe('issue 1244', () => {
  it('correctly redirects when target=_top with target.target =', () => {
    cy.visit('/fixtures/issue-1244.html')
    cy.get('#setTarget').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('correctly redirects when target=_top with setAttribute', () => {
    cy.visit('/fixtures/issue-1244.html')
    cy.get('#setAttr').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('correctly redirects when target=_top inline in dom', () => {
    cy.visit('/fixtures/issue-1244.html')
    cy.get('#inline').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })
})
