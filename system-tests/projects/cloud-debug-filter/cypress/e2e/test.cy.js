it('should pass - 1', () => {
  expect(true).eq(true)
})

it('should fail - 1', () => {
  expect(true).eq(false)
})

describe('nested - 1', () => {
  it('should pass - 2', () => {
    expect(true).eq(true)
  })

  it('should fail - 2', () => {
    expect(true).eq(false)
  })
})
