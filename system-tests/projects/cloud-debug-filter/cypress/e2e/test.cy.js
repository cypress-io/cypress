it('t1', () => {
  expect(true).eq(true)
})

it('t2', () => {
  expect(true).eq(false)
})

describe('s1', () => {
  it('t3', () => {
    expect(true).eq(true)
  })

  it('t4', () => {
    expect(true).eq(false)
  })
})
