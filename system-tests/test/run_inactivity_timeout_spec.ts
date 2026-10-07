import systemTests from '../lib/system-tests'

describe('run mode inactivity timeout', () => {
  systemTests.setup()

  // The hanging spec is failed after the inactivity window and the next spec still runs.
  systemTests.it('fails a spec that stops making progress and continues', {
    project: 'e2e',
    spec: 'run_inactivity_hang.cy.ts,simple.cy.js',
    browser: 'electron',
    expectedExitCode: 1,
    processEnv: {
      CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT: '5000',
    },
    onStdout: (stdout) => {
      expect(stdout).to.include('Cypress received no activity from the browser for')
      expect(stdout).to.include('We have failed the current spec but will continue running the next spec.')
      expect(stdout).to.include('Running:  simple.cy.js')
      expect(stdout).to.match(/✖\s+run_inactivity_hang\.cy\.ts/)
      expect(stdout).to.match(/✔\s+simple\.cy\.js/)
    },
  })
})
