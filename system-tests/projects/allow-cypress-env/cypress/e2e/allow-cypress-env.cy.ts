describe('Cypress.env removal', () => {
  it('does not expose Cypress.env', () => {
    expect(Cypress.env).to.eq(undefined)
  })
})
