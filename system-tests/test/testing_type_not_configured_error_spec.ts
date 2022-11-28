const systemTests = require('../lib/system-tests').default

describe('testing type not configured error on run mode', () => {
  systemTests.setup()

  systemTests.it('reports correct exit code when failing attempting to run e2e', {
    project: 'simple-ct',
    testingType: 'e2e',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('reports correct exit code when failing attempting to run component', {
    project: 'e2e',
    testingType: 'component',
    snapshot: true,
    expectedExitCode: 1,
  })
})
