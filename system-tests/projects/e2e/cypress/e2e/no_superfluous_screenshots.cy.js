describe('Superfluous screenshots.', { retries: 1 }, function () {
  let foo = undefined

  afterEach(function () {
    foo = 'X'
    expect(this.currentTest.state).not.to.equal('failed')
  })

  it('Failing test which passes for the second time.', () => {
    expect(foo).to.equal('X')
  })

  it('Passing test 1.', () => {
    expect(true).to.be.true
  })

  it('Passing test 2.', () => {
    expect(false).to.be.false
  })
})
