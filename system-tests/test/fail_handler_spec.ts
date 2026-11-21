import systemTests from '../lib/system-tests'

describe('e2e fail handlers', () => {
  systemTests.setup()

  systemTests.it('passes tests whose fail handlers do not throw', {
    spec: 'fail_handler.cy.ts',
    snapshot: true,
    expectedExitCode: 2,
    config: { screenshotOnRunFailure: false },
  })
})
