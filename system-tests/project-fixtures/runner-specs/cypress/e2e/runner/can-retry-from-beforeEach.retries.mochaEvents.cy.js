/* eslint-disable mocha/no-sibling-hooks -- the mocha events snapshot records each sibling hook separately */
describe('suite 1', { retries: 1 }, () => {
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
