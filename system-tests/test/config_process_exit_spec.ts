import systemTests, { expect } from '../lib/system-tests'

describe('e2e config process exits unexpectedly', () => {
  systemTests.setup()

  systemTests.it('reports the exit once and ends the run instead of hanging', {
    project: 'config-process-exit',
    spec: 'kills_config_process.cy.ts,never_runs.cy.ts',
    browser: 'electron',
    expectedExitCode: 1,
    snapshot: false,
    onStdout (stdout) {
      expect(stdout.match(/exited unexpectedly/g)).to.have.length(1)
      expect(stdout).to.include('Running:  kills_config_process.cy.ts')
      expect(stdout).not.to.include('Running:  never_runs.cy.ts')
    },
  })
})
