describe('retries', () => {
  let i = 0

  it('passes after 1 failure', { retries: 1 }, () => {
    if (i === 0) {
      i++
      expect(1).to.eq(2)
    }

    expect(1).to.eq(1)
  })
})
