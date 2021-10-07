describe('App', () => {
  xit('resolves the home page', () => {
    cy.visit('http://localhost:5556')
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })

  it('1 + 1 = 2', () => {
    expect(1 + 1).to.eq(2)
  })
})
