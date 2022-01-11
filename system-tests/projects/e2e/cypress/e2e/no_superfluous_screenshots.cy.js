describe('Superfluous screenshots.', { retries: 1 }, function () {
  afterEach(function () {
    Cypress.env('SOMEVARIABLE', 'X')
    expect(this.currentTest.state).not.to.equal('failed')
  })

  it('Failing test which passes for the second time.', () => {
    expect(Cypress.env('SOMEVARIABLE')).to.equal('X')
  })

  it('Passing test 1.', () => {
    expect(true).to.be.true
  })

  it('Passing test 2.', () => {
    expect(false).to.be.false
  })
})
