import systemTests from '../lib/system-tests'

describe('Test Isolation', () => {
  systemTests.setup()

  systemTests.it('fires events in the right order with the right arguments - run mode', {
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: 0,
    timeout: 20000,
    browser: 'chrome',
  })
})
