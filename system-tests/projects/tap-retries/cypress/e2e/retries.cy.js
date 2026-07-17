describe('Retries', () => {
  // The spec module is evaluated once per run, so this counter persists across
  // the test's retries: attempt 1 fails, attempt 2 passes. That yields one
  // prevAttempt (a failed first run) plus the passing latest attempt.
  let attempts = 0

  it('passes on the second attempt', { retries: 1 }, () => {
    attempts++

    expect(attempts, 'attempt').to.be.greaterThan(1)
  })
})
