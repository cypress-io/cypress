describe('suite 1', () => {
  after(() => {
    throw new Error('Error!')
  })

  it('test 1', () => {})
  it('test 2', () => {})
})
