// https://github.com/cypress-io/cypress/issues/26143
// When the first attempt fails in BOTH the beforeEach and afterEach hooks, the
// reporter should still print a single `(Attempt 1 of 3)` line for that attempt.
let firstAttempt = true

beforeEach(() => {
  if (firstAttempt) {
    throw new Error('Something went wrong')
  }
})

afterEach(() => {
  if (firstAttempt) {
    firstAttempt = false
    throw new Error('Something went wrong')
  }
})

it('fails beforeEach and afterEach on the first attempt', () => {})
