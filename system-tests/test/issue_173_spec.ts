import systemTests from '../lib/system-tests'

describe('e2e issue 173', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/173
  systemTests.it('failing', {
    spec: 'issue_173_spec.js',
    snapshot: true,
    expectedExitCode: 1,
  })
})
