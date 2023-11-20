describe('suite 1', () => {
  afterEach(() => {
    throw new Error('After each error')
  })

  it('test 1', () => {})
  it('test 2', () => {})
})
