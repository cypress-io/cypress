describe('suite 1', () => {
  before(() => {})
  beforeEach(() => {})
  after(() => {})
  afterEach(() => {})

  it('test 1', () => {
    throw new Error('T1 fail')
  })

  // eslint-disable-next-line mocha/no-exclusive-tests
  it.only('test 2', () => {
    throw new Error('T2 fail')
  })

  it('test 3', () => {
    throw new Error('T3 fail')
  })
})
