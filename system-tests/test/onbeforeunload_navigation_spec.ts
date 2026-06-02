import systemTests from '../lib/system-tests'

describe('e2e onbeforeunload navigation', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/2118
  // Navigating away from a page whose beforeunload handler requests a
  // confirmation prompt used to hang the Electron browser until pageLoadTimeout.
  // cy.press dispatches a trusted key event (real user gesture) so the prompt is
  // actually honored by Chromium; without the fix this spec hangs and the run
  // exits non-zero. This is Electron-specific, so it is pinned to that browser.
  systemTests.it('does not hang navigating away from a beforeunload prompt', {
    browser: 'electron',
    spec: 'navigate_away_beforeunload.cy.ts',
    snapshot: false,
    expectedExitCode: 0,
  })
})
