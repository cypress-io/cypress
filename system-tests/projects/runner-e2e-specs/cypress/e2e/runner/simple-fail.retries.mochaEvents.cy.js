describe('suite 1', { retries: 1 }, () => {
  let i = 0

  it('test 1', () => {
    if (i === 0) {
      i++
      throw new Error('test 1')
    }
  })
})
