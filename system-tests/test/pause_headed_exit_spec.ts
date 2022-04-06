import systemTests from '../lib/system-tests'

describe('cy.pause() works with --headed and --no-exit', () => {
  systemTests.setup()

  systemTests.it('pauses', {
    spec: 'pause_spec.js',
    snapshot: false,
    headed: true,
    noExit: true,
    expectedExitCode: 0,
  })

  systemTests.it('does not pause', {
    spec: 'no_pause_spec.js',
    snapshot: false,
    headed: false,
    noExit: true,
    expectedExitCode: 0,
  })

  systemTests.it('does not pause', {
    spec: 'no_pause_spec.js',
    snapshot: false,
    headed: true,
    noExit: false,
    expectedExitCode: 0,
  })

  systemTests.it('does not pause', {
    spec: 'no_pause_spec.js',
    snapshot: false,
    headed: false,
    noExit: false,
    expectedExitCode: 0,
  })
})
