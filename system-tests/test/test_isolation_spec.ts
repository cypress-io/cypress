import systemTests from '../lib/system-tests'
import childProcess from 'child_process'

describe('Test Isolation', () => {
  systemTests.setup()

  systemTests.it('fires events in the right order with the right arguments - run mode', {
    project: 'cypress-in-cypress',
    spec: 'test-isolation.spec.js',
    expectedExitCode: 0, // expectedExitCode: 1, // should be 1?
    timeout: 20000,
    browser: 'chrome',
  })

  systemTests.it('makes lasagna - false - true', {
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

  // systemTests.it('makes lasagna - true - false', {
  //   project: 'cypress-in-cypress',
  //   spec: 'test-isolation.spec.js',
  //   expectedExitCode: 1,
  //   timeout: 20000,
  //   browser: 'chrome',
  //   snapshot: true,
  //   headed: true,
  //   noExit: false,
  //   onSpawn: (cp) => {
  //     cp.stdout.on('data', (buf) => {
  //       if (buf.toString().includes('not exiting due to options.exit being false')) {
  //         // systemTests.it spawns a new node process which then spawns the actual cypress process
  //         // Killing just the new node process doesn't kill the cypress process so we find it and kill it manually
  //         childProcess.execSync(`kill $(pgrep -P ${cp.pid} | awk '{print $1}')`)
  //         cp.kill()
  //       }
  //     })
  //   },
  // })

  // systemTests.it('makes ravioli - false - false', {
  //   project: 'cypress-in-cypress',
  //   spec: 'test-isolation.spec.js',
  //   expectedExitCode: 1,
  //   timeout: 20000,
  //   browser: 'chrome',
  //   snapshot: true,
  //   headed: false,
  //   noExit: false,
  //   onSpawn: (cp) => {
  //     cp.stdout.on('data', (buf) => {
  //       if (buf.toString().includes('not exiting due to options.exit being false')) {
  //         // systemTests.it spawns a new node process which then spawns the actual cypress process
  //         // Killing just the new node process doesn't kill the cypress process so we find it and kill it manually
  //         childProcess.execSync(`kill $(pgrep -P ${cp.pid} | awk '{print $1}')`)
  //         cp.kill()
  //       }
  //     })
  //   },
  // })

  // systemTests.it('makes aribiatta - true - true', {
  //   project: 'cypress-in-cypress',
  //   spec: 'test-isolation.spec.js',
  //   expectedExitCode: 1,
  //   timeout: 20000,
  //   browser: 'chrome',
  //   snapshot: true,
  //   headed: true,
  //   noExit: true,
  //   onSpawn: (cp) => {
  //     cp.stdout.on('data', (buf) => {
  //       if (buf.toString().includes('not exiting due to options.exit being false')) {
  //         // systemTests.it spawns a new node process which then spawns the actual cypress process
  //         // Killing just the new node process doesn't kill the cypress process so we find it and kill it manually
  //         childProcess.execSync(`kill $(pgrep -P ${cp.pid} | awk '{print $1}')`)
  //         cp.kill()
  //       }
  //     })
  //   },
  // })
})
