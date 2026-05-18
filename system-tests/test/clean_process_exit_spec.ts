import systemTests, { expect, type ExecResult } from '../lib/system-tests'

describe('clean process exit (teardown)', () => {
  systemTests.setup()

  // systemTests.exec asserts expected exit code and that the Cypress child did not
  // terminate via a signal (e.g. SIGABRT during teardown). See exit handler in
  // lib/system-tests.ts.
  systemTests.it('exits with code 0 without terminating by signal after a passing run', {
    spec: 'simple_passing.cy.js',
    expectedExitCode: 0,
    browser: ['electron'],
    project: 'e2e',
  })

  // After a completed run with --no-exit, send SIGINT to the launcher process and
  // assert teardown does not abort (SIGABRT). Exit may be graceful (code) or via
  // SIGINT depending on platform/handlers; SIGABRT indicates a regression.
  systemTests.it('exits without a sigabrt when sent a sigint', {
    spec: 'simple_passing.cy.js',
    project: 'e2e',
    browser: ['electron'],
    noExit: true,
    expectedExitCode: null,
    onSpawn: (cp) => {
      let sent = false
      let stdoutAcc = ''

      cp.stdout.on('data', (buf) => {
        if (sent) {
          return
        }

        stdoutAcc += buf.toString()

        if (stdoutAcc.includes('not exiting due to options.exit being false')) {
          sent = true
          cp.kill('SIGINT')
        }
      })
    },
    onRun: async (execFn) => {
      const result: ExecResult = await execFn()

      expect(result.signal, 'process should not terminate by SIGABRT').to.not.equal('SIGABRT')

      return result
    },
  })
})
