const systemTests = require('../lib/system-tests').default

describe('e2e commands outside of test', () => {
  systemTests.setup()

  systemTests.it('fails on cy commands', {
    spec: 'commands_outside_of_test.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('fails on failing assertions', {
    spec: 'assertions_failing_outside_of_test.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('passes on passing assertions', {
    spec: 'assertions_passing_outside_of_test.cy.js',
    snapshot: true,
  })
})
