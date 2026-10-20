import systemTests from '../lib/system-tests'

const DEPRECATION_MESSAGE = 'The Electron browser is deprecated as a test browser'

// The deprecation warning is stripped from run-mode snapshots by normalizeStdout,
// so these tests assert against the raw (un-normalized) stdout to verify it is
// actually emitted for Electron — and not for other browsers.
describe('e2e electron browser deprecation', () => {
  systemTests.setup()

  systemTests.it('warns that the Electron browser is deprecated in run mode', {
    project: 'e2e',
    spec: 'simple_passing.cy.js',
    browser: 'electron',
    snapshot: false,
    async onRun (exec) {
      const { stdout } = await exec()

      expect(stdout).to.include(DEPRECATION_MESSAGE)
      // the Run Starting "Browser:" line is also marked as deprecated
      expect(stdout).to.include('(deprecated)')
    },
  })

  systemTests.it('does not warn when running a non-deprecated browser', {
    project: 'e2e',
    spec: 'simple_passing.cy.js',
    browser: 'chrome',
    snapshot: false,
    async onRun (exec) {
      const { stdout } = await exec()

      expect(stdout).not.to.include(DEPRECATION_MESSAGE)
      expect(stdout).not.to.include('(deprecated)')
    },
  })
})
