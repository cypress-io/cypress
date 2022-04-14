describe('withFailure', () => {
  it('fails', () => {
    expect(true).to.eq(false)
  })

  it('passes', () => {
    expect(true).to.eq(true)
  })

  it('passes with delay', () => {
    cy.log('switch spec')
    cy.wait(3000)
    expect(true).to.eq(true)
  })

  it('passes again', () => {
    expect(true).to.eq(true)
  })
})
