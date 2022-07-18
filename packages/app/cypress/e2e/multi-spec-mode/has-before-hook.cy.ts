describe('before', () => {
  before(() => {
    Cypress.config('baseUrl', 'https://www.google.com')
  })

  it('has expected baseUrl', () => {
    expect(Cypress.config().baseUrl).to.equal('https://www.google.com')
  })
})
