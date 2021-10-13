const systemTests = require('../lib/system-tests').default

describe('run-ct', () => {
  systemTests.setup()

  systemTests.it('reports correct exit code when failing', {
    spec: 'simple_failing_spec.js',
    testingType: 'component',
    snapshot: false,
    expectedExitCode: 2,
  })
})
