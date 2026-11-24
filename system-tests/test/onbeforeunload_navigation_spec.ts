import systemTests from '../lib/system-tests'

describe('e2e onbeforeunload navigation', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/2118
  // https://github.com/cypress-io/cypress/issues/28553
  // cy.press dispatches a trusted key event (real user gesture), so the
  // browser honors the page's beforeunload prompt. Cypress accepts the prompt,
  // so reloading and navigating away finish instead of waiting on it until
  // pageLoadTimeout.
  systemTests.it('does not hang navigating away from a beforeunload prompt', {
    browser: ['electron', 'chrome', 'firefox'],
    spec: 'navigate_away_beforeunload.cy.ts',
    snapshot: false,
    expectedExitCode: 0,
  })

  // https://github.com/cypress-io/cypress/issues/28553
  // Cypress accepts a beforeunload prompt when it navigates away between tests
  // and when the run ends, so `cypress run` finishes.
  systemTests.it('does not hang when a test leaves a page with a beforeunload prompt', {
    browser: ['electron', 'chrome', 'firefox'],
    spec: 'beforeunload_left_open.cy.ts',
    snapshot: false,
    expectedExitCode: 0,
  })
})
