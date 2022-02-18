describe('should not hang when an error is thrown in a before() block', () => {
  before(() => {
    expect(true).to.be.false
  })

  after(() => {})
  it('has a test')
  it('has another test')
})
