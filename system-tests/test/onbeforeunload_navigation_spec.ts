import systemTests from '../lib/system-tests'

describe('e2e onbeforeunload navigation', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/2118
  // https://github.com/cypress-io/cypress/issues/28553
  // Navigating away from a page whose beforeunload handler requests a
  // confirmation prompt used to hang the browser until pageLoadTimeout.
  // cy.press dispatches a trusted key event (real user gesture) so the prompt is
  // actually honored by the browser; without the fix this spec hangs and the run
  // exits non-zero.
  systemTests.it('does not hang navigating away from a beforeunload prompt', {
    browser: ['electron', 'chrome', 'firefox'],
    spec: 'navigate_away_beforeunload.cy.ts',
    snapshot: false,
    expectedExitCode: 0,
  })

  // https://github.com/cypress-io/cypress/issues/28553
  // A beforeunload prompt left open when Cypress navigated away between tests,
  // or when the run ended, used to hang `cypress run`.
  systemTests.it('does not hang when a test leaves a page with a beforeunload prompt', {
    browser: ['electron', 'chrome', 'firefox'],
    spec: 'beforeunload_left_open.cy.ts',
    snapshot: false,
    expectedExitCode: 0,
  })
})
