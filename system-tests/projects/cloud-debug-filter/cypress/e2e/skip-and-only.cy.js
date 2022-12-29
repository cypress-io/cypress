// eslint-disable-next-line
it.only('t1', () => {
  expect(true).eq(false)
})

// eslint-disable-next-line
it.skip('t2', () => {
  expect(true).eq(true)
})

it('t3', () => {
  expect(true).eq(false)
})

// eslint-disable-next-line
describe.only('s1', () => {
  it('t4', () => {
    expect(true).eq(false)
  })
})
