const e2e = require('../support/helpers/e2e').default

describe('e2e return value', () => {
  e2e.setup()

  it('failing1', function () {
    return e2e.exec(this, {
      spec: 'return_value_spec.coffee',
      snapshot: true,
      expectedExitCode: 3,
    })
  })
})
