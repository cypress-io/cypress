describe('suite', () => {
  it('is skipped due to test-level browser override', {
    browser: ['!chrome'],
  }, () => {})
})

describe('suite 2', {
  browser: ['!chrome'],
}, () => {
  it('is skipped due to suite-level browser override', () => {
    // do something
  })
})
