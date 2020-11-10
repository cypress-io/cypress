describe('failures', () => {
  it('failure1', () => {
    throw new Error('foo')
  })

  it('failure2', () => {
    throw new Error('bar')
  })
})
