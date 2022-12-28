// eslint-disable-next-line
it.only('should fail - 1', () => {
  expect(true).eq(false)
})

// eslint-disable-next-line
it.skip('should fail - 2', () => {
  expect(true).eq(true)
})

it('should fail - 3', () => {
  expect(true).eq(false)
})
