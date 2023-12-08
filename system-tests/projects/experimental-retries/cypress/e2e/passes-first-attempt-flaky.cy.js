describe('deterministic flaky test', () => {
  it('deterministically runs pass/fail on this test', function () {
    // this means the test WILL behave as
    // first attempt (PASS)
    // second attempt (FAIL)
    // third attempt (PASS)
    // fourth attempt (FAIL)
    // fifth attempt (PASS)...
    if (this.test.currentRetry() % 2) {
      expect(true).to.be.false
    } else {
      expect(true).to.be.true
    }
  })
})
