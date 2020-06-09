const e2e = require('../support/helpers/e2e').default

describe('e2e promises', () => {
  e2e.setup()

  e2e.it('failing1', {
    spec: 'promises_spec.coffee',
    snapshot: true,
    expectedExitCode: 2,
  })
})
