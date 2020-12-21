describe('Component testing runner', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4444/__ct/')
  })

  it('Opens component testing interface and runs test', () => {
    cy.wait(500)
    cy.contains('18n').next().contains('spec.js').click()
    cy.get('.reporter').should('contain', 'VueI18n')
    cy.get('li.passed').should('contain', 2)
  })
})
