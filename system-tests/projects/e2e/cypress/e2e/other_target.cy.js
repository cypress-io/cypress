context('Test', () => {
  it('visit site with unsupported content', () => {
    cy.visit('http://localhost:1515/other_target.html')
  })
})
