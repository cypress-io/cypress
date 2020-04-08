import e2e from '../support/helpers/e2e'

describe('per-test-config', () => {
  e2e.setup()

  e2e.it('fails when passing invalid config value browser', {
    spec: 'per-test-config-invalid-browser.js',
    snapshot: true,
    expectedExitCode: 1,
  })
})
