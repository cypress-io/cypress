// https://github.com/cypress-io/cypress/issues/26143
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
