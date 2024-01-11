describe('passes then fails', () => {
  it('passes first 2 attempts and then fails', function () {
    if (this.test.currentRetry() < 2) {
      expect(true).to.be.true
    } else {
      expect(true).to.be.false
    }
  })
})
