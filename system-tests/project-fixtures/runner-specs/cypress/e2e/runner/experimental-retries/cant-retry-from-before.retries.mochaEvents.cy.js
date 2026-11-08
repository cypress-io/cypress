/* eslint-disable mocha/no-sibling-hooks -- the mocha events snapshot records each sibling hook separately */
describe('suite 1', () => {
  let i = 0

  before(() => {
    if (i === 0) {
      i++
      throw new Error('')
    }
  })

  beforeEach(() => {})
  beforeEach(() => {})
  afterEach(() => {})
  afterEach(() => {})
  after(() => {})
  it('test 1', () => {})
})
