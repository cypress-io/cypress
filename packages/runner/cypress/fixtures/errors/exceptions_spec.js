import './setup'

const outsideError = require('../../../../server/test/support/fixtures/projects/todos/throws-error')

describe('exception failures', () => {
  it('in spec file', () => {
    ({}).bar()
  })

  it('in file outside project', () => {
    outsideError()
  })
})
