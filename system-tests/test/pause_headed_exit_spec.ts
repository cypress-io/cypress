import systemTests from '../lib/system-tests'
import childProcess from 'child_process'

// these system tests are skipped in webkit due to flake.
// TODO: https://github.com/cypress-io/cypress/issues/31503

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
    browser: '!webkit',
    onSpawn: (cp) => {
      cp.stdout.on('data', (buf) => {
        if (buf.toString().includes('not exiting due to options.exit being false')) {
          // systemTests.it spawns a new node process which then spawns the actual cypress process
          // Killing just the new node process doesn't kill the cypress process so we find it and kill it manually
          childProcess.execSync(`kill $(pgrep -P ${cp.pid} | awk '{print $1}')`)
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
    browser: '!webkit',
    onSpawn: (cp) => {
      cp.stdout.on('data', (buf) => {
        if (buf.toString().includes('not exiting due to options.exit being false')) {
          // systemTests.it spawns a new node process which then spawns the actual cypress process
          // Killing just the new node process doesn't kill the cypress process so we find it and kill it manually
          childProcess.execSync(`kill $(pgrep -P ${cp.pid} | awk '{print $1}')`)
          cp.kill()
        }
      })
    },
  })

  // TODO: fix this failing test in 10.0
  systemTests.it.skip('does not pause without --no-exit', {
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
    browser: '!webkit',
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
    browser: '!webkit',
  })
})
