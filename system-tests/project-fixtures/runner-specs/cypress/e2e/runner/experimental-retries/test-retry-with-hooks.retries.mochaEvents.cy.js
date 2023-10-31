describe('suite 1', () => {
  before(() => {})
  beforeEach(() => {})
  after(() => {})
  afterEach(() => {})

  let i = 0

  it('test 1', () => {
    if (i === 0) {
      i++
      throw new Error('test 1')
    }
  })
})
