describe('suite 1', () => {
  before(() => {})
  beforeEach(() => {})
  after(() => {})
  afterEach(() => {})

  it('test 1', () => {})

  let i = 0

  // eslint-disable-next-line mocha/no-exclusive-tests
  it.only('test 2', () => {
    if (i === 0) {
      i++
      throw new Error('test 2')
    }
  })

  it('test 3', () => {})
})
