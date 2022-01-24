describe('canary', () => {
  it('is not running or else this would fail CI', () => {
    throw new Error()
  })
})
