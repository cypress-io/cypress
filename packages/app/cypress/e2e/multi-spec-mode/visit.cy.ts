describe('', () => {
  it('does not have baseUrl set', () => {
    expect(Cypress.config().baseUrl).to.not.equal('https://www.google.com/')
  })
})
