let firstAttempt = true

beforeEach(() => {
  if (firstAttempt) {
    throw new Error('failed in beforeEach')
  }
})

afterEach(() => {
  if (firstAttempt) {
    firstAttempt = false

    throw new Error('failed in afterEach')
  }
})

it('fails in both hooks', () => {})
