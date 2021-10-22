import './setup'

const outsideError = require('@tooling/system-tests/projects/todos/throws-error')

describe('exception failures', () => {
  it('in spec file', () => {
    ({}).bar()
  })

  it('in file outside project', () => {
    outsideError()
  })
})
