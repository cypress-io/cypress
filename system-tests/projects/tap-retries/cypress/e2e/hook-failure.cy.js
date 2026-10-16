describe('Hook Failure', () => {
  before(() => {
    throw new Error('the before hook could not set up')
  })

  it('carries the hook failure', () => {
    expect(true).to.eq(true)
  })

  it('is skipped along with it', () => {
    expect(true).to.eq(true)
  })

  it('is skipped too', () => {
    expect(true).to.eq(true)
  })
})
