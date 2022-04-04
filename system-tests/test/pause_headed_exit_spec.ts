import systemTests from '../lib/system-tests'

describe('cy.pause() works with --headed and --no-exit', () => {
  systemTests.setup()

  systemTests.it('passes', {
    spec: 'pause_simple_spec.js',
    snapshot: false,
    expectedExitCode: 0,
  })
})
