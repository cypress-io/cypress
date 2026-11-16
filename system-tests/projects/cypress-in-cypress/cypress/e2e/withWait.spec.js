describe('withWait', () => {
  it('passes (1 of 4)', () => {
    cy.wait(2000)
    expect(true).to.eq(true)
  })

  it('passes (2 of 4)', () => {
    cy.wait(2000)
    expect(true).to.eq(true)
  })

  it('passes (3 of 4)', () => {
    cy.wait(2000)
    expect(true).to.eq(true)
  })

  it('passes (4 of 4)', () => {
    cy.wait(2000)
    expect(true).to.eq(true)
  })
})
