const outsideError = require('../../../src/throws-error')

describe('exception failures', () => {
  it('in spec file', () => {
    ({}).bar()
  })

  it('in file outside project', () => {
    outsideError()
  })
})
