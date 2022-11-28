describe('issue 17512', () => {
  beforeEach(() => {
    cy.visit('fixtures/issue-17512.html')
  })

  it('returns null when target is not defined', () => {
    cy.get('#link').click()
    cy.get('#result').should('have.text', 'null')

    cy.get('#link2').click()
    cy.get('#result2').should('have.text', '"_top"')

    cy.get('#link3').click()
    cy.get('#result3').should('have.text', 'null')
  })
})
