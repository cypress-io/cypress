import systemTests from '../lib/system-tests'

systemTests.it('should not run CT side effects in e2e with mount registration', {
  project: 'e2e-with-mount-import',
  spec: 'passing.cy.js',
  browser: 'chrome',
  expectedExitCode: 0,
})
