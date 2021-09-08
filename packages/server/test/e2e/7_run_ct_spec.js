const e2e = require('../support/helpers/e2e').default

describe('run-ct', () => {
  e2e.setup()

  e2e.it('reports correct exit code when failing', {
    spec: 'simple_failing_spec.js',
    testingType: 'component',
    snapshot: false,
    expectedExitCode: 2,
  })
})
