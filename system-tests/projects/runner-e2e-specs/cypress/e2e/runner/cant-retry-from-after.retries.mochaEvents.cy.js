describe('suite 1', { retries: 1 }, () => {
  before(() => {})
  beforeEach(() => {})
  beforeEach(() => {})
  afterEach(() => {})
  afterEach(() => {})
  let i = 0

  after(() => {
    if (i === 0) {
      i++
      throw new Error('')
    }
  })

  it('test 1', () => {})
})
