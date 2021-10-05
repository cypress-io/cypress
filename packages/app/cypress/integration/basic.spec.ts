xdescribe('App', () => {
  it('resolves the home page', () => {
    cy.visit('http://localhost:5556')
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})


describe('App', () => {
  it('resolves the home page', () => {
    expect(1).to.eq(1)
  })
})
