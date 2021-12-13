const systemTests = require('../lib/system-tests').default

describe('run-ct', () => {
  systemTests.setup()

  systemTests.it('reports correct exit code when failing', {
    spec: 'simple_failing.cy.js',
    testingType: 'component',
    snapshot: false,
    expectedExitCode: 2,
  })

  systemTests.it('runs in component testing mode', {
    spec: 'simple_passing_component.cy.js',
    testingType: 'component',
    snapshot: false,
  })
})
