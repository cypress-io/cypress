// using "unknown" for the browser as we don't want this to match and behave differently when running across different browsers
it('t1', { browser: 'unknown' }, () => {
  expect(true).eq(false)
})

describe('s1', { browser: 'unknown' }, () => {
  it('t2', () => {
    expect(true).eq(false)
  })
})
