describe('page', { retries: 4 }, () => {
  for (let i = 0; i < 10; i++) {
    it(`test ${i}`, () => {
      expect(true).to.be.false
    })
  }
})
