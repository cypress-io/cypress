import systemTests from '../lib/system-tests'

describe('e2e binary --workers', () => {
  systemTests.it('reads the container memory limit and runs every spec across workers', {
    withBinary: true,
    dockerImage: 'cypress/base-internal:24.22.1-trixie',
    // one worker's estimated peak fits, two don't
    dockerMemoryMb: 2048,
    project: 'run-workers',
    browser: 'electron',
    workers: 2,
    expectedExitCode: 1,
    snapshot: false,
    timeout: 240000,
    async onRun (exec) {
      const { stdout } = await exec()

      expect(stdout).to.include('Running 2 workers may run out of memory')
      expect(stdout).to.include('Running 6 specs on 2 workers')
      expect(stdout).not.to.include('exited early')
      // tests, passing, failing
      expect(stdout).to.match(/1 of 6 failed \(17%\)\s+\S+\s+6\s+5\s+1\s/)
    },
  })
})
