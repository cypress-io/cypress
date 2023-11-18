describe('deterministic flaky test', () => {
  it('deterministically runs pass/fail on this test', function () {
    // this means the test WILL behave as
    // first attempt (FAIL)
    // second attempt (PASS)
    // third attempt (FAIL)
    // fourth attempt (PASS)
    // fifth attempt (FAIL)...
    if (this.test.currentRetry() % 2) {
      expect(true).to.be.true
    } else {
      expect(true).to.be.false
    }
  })
})
