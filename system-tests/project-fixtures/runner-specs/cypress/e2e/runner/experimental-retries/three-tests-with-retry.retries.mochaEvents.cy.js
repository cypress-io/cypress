describe('suite 1', () => {
  before(() => {})
  beforeEach(() => {})
  afterEach(() => {})
  after(() => {})

  it('test 1', () => {})

  let i = 0

  it('test 2', () => {
    if (i <= 1) {
      i++
      throw new Error('')
    }
  })

  it('test 3', () => {})
})
