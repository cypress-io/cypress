import systemTests from '../lib/system-tests'

// https://github.com/cypress-io/cypress/issues/34810
// https://github.com/cypress-io/cypress/issues/35026
describe('e2e unowned Cypress-reserved paths', () => {
  systemTests.setup()

  systemTests.it('answers requests for reserved paths nothing serves', {
    project: 'unowned-reserved-path',
    spec: 'spec.cy.ts',
    browser: ['electron', 'chrome'],
    // A request that is never answered leaves a sync XHR blocking the
    // renderer for good, so bound the run instead of waiting for the default.
    timeout: 90000,
    onStdout: (stdout) => {
      expect(stdout).to.include('7 passing')
    },
  })
})
