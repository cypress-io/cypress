describe('preview-head.html', () => {
  it('should load index.html with user provided preview-head.html', () => {
    Cypress.$('#__cy_root').addClass('preview-head-test-class')
    cy.get('#__cy_root').should('have.css', 'background-color', 'rgb(255, 0, 0)')
  })
})
