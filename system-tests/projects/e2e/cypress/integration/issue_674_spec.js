describe('issue 674', () => {
  beforeEach(() => {
    throw new Error()
  })

  afterEach(() => {
    throw new Error()
  })

  it('does not hang when both beforeEach and afterEach fail', () => {})
})
