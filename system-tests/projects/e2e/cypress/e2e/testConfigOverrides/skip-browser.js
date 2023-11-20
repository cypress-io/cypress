describe('suite', () => {
  it('is skipped due to test-level browser override', {
    browser: ['!electron'],
  }, () => {})
})

describe('suite 2', {
  browser: ['!electron'],
}, () => {
  it('is skipped due to suite-level browser override', () => {
    // do something
  })
})
