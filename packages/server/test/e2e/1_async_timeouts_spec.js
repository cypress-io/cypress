const e2e = require('../support/helpers/e2e').default

describe('e2e async timeouts', () => {
  e2e.setup()

  e2e.it('failing1', {
    spec: 'async_timeouts_spec.coffee',
    snapshot: true,
    expectedExitCode: 2,
  })
})
