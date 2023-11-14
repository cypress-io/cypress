let i = 0

afterEach(() => {
  if (i === 0) {
    i++
    throw new Error('')
  }
})

describe('suite 1', () => {
  before(() => {})
  beforeEach(() => {})
  beforeEach(() => {})
  afterEach(() => {})
  after(() => {})

  it('test 1', () => {})
  it('test 2', () => {})
  it('test 3', () => {})
})

describe('suite 2', () => {
  let j = 0

  afterEach(() => {
    if (j === 0 || j === 1) {
      j++
      throw new Error('')
    }
  })

  it('test 1', () => {})
})

describe('suite 3', () => {
  it('test 1', () => {})
})
