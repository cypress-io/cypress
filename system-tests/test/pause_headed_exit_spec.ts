import systemTests from '../lib/system-tests'

describe('cy.pause() works with --headed and --no-exit', () => {
  systemTests.setup()

  systemTests.it('pauses with --headed and --no-exit', {
    spec: 'pause_spec.js',
    snapshot: true,
    headed: true,
    noExit: true,
    expectedExitCode: null,
    onSpawn: (cp) => {
      cp.stdout.on('data', (buf) => {
        if (buf.toString().includes('not exiting due to options.exit being false')) {
          cp.kill()
        }
      })
    },
  })

  systemTests.it('does not pause if headless', {
    spec: 'no_pause_spec.js',
    snapshot: true,
    headed: false,
    noExit: true,
    expectedExitCode: null,
    onSpawn: (cp) => {
      cp.stdout.on('data', (buf) => {
        if (buf.toString().includes('not exiting due to options.exit being false')) {
          cp.kill()
        }
      })
    },
  })

  systemTests.it('does not pause without --no-exit', {
    spec: 'no_pause_spec.js',
    snapshot: true,
    headed: true,
    noExit: false,
    expectedExitCode: 0,
  })

  systemTests.it('does not pause without --headed and --no-exit', {
    spec: 'no_pause_spec.js',
    snapshot: true,
    headed: false,
    noExit: false,
    expectedExitCode: 0,
  })
})
