import systemTests from '../lib/system-tests'

describe('e2e fail handlers', () => {
  systemTests.setup()

  systemTests.it('passes or fails each test according to its fail handler', {
    spec: 'fail_handler.cy.ts',
    snapshot: true,
    expectedExitCode: 2,
    config: { screenshotOnRunFailure: false },
  })
})
