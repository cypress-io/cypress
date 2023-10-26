describe('suite 1', () => {
  before(() => {})
  beforeEach(() => {})

  let i = 0

  beforeEach(() => {
    if (i === 0) {
      i++
      throw new Error('')
    }
  })

  beforeEach(() => {})

  afterEach(() => {})
  after(() => {})

  it('test 1', () => {})
})
