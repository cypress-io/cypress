import systemTests from '../lib/system-tests'
import childProcess from 'child_process'

describe('Test Isolation', () => {
  systemTests.setup()

  systemTests.it('fires events in the right order with the right arguments - run mode', {
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: 0,
    timeout: 20000,
    browser: 'chrome',
  })

  systemTests.it('fires events in the right order with the right arguments when overridden within the spec - run mode', {
    project: 'cypress-in-cypress',
    spec: 'test-isolation-describe-config.spec.js',
    expectedExitCode: 0,
    timeout: 20000,
    browser: 'chrome',
  })

  systemTests.it('fires events in the right order with the right arguments - headed: true - noExit: true', {
    config: {
      env: {
        'SHOULD_PAUSE': false,
      },
    },
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: null,
    timeout: 20000,
    browser: 'chrome',
    snapshot: true,
    headed: true,
    noExit: true,
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

  systemTests.it('fires events in the right order with the right arguments - headed: false - noExit: true', {
    config: {
      env: {
        'SHOULD_PAUSE': false,
      },
    },
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: null,
    timeout: 20000,
    browser: 'chrome',
    snapshot: true,
    headed: false,
    noExit: true,
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

  systemTests.it('fires events in the right order with the right arguments - headed: false - noExit: false', {
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: 0,
    timeout: 20000,
    browser: 'chrome',
    snapshot: true,
    headed: false,
    noExit: false,
  })

  systemTests.it('fires events in the right order with the right arguments - headed: true - noExit: false', {
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: 0,
    timeout: 20000,
    browser: 'chrome',
    snapshot: true,
    headed: true,
    noExit: false,
  })
})
