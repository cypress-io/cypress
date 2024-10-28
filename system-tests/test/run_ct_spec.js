const systemTests = require('../lib/system-tests').default

describe('run ct', () => {
  systemTests.setup()

  systemTests.it('reports correct exit code when failing', {
    spec: 'src/simple_failing.cy.js',
    project: 'simple-ct',
    testingType: 'component',
    snapshot: false,
    expectedExitCode: 2,
  })

  systemTests.it('runs in component testing mode', {
    project: 'simple-ct',
    spec: 'src/simple_passing_component.cy.js',
    testingType: 'component',
    snapshot: false,
  })
})
