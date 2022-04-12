import systemTests from '../lib/system-tests'

describe('cy.pause() in run mode', () => {
  systemTests.setup()

  systemTests.it('pauses with --headed and --no-exit', {
    spec: 'pause.cy.js',
    config: {
      env: {
        'SHOULD_PAUSE': true,
      },
    },
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
    spec: 'pause.cy.js',
    config: {
      env: {
        'SHOULD_PAUSE': false,
      },
    },
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
    spec: 'pause.cy.js',
    config: {
      env: {
        'SHOULD_PAUSE': false,
      },
    },
    snapshot: true,
    headed: true,
    noExit: false,
    expectedExitCode: 0,
  })

  systemTests.it('does not pause without --headed and --no-exit', {
    spec: 'pause.cy.js',
    config: {
      env: {
        'SHOULD_PAUSE': false,
      },
    },
    snapshot: true,
    headed: false,
    noExit: false,
    expectedExitCode: 0,
  })
})
