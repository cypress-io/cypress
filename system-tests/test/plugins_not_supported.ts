import systemTests from '../lib/system-tests'

describe('plugins not supported in v10', () => {
  systemTests.setup()

  systemTests.it('@cypress/code-coverage', {
    browser: 'electron',
    project: 'plugin-code-coverage',
    spec: '*',
    snapshot: true,
    expectedExitCode: 1,
  })
})
