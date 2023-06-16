const systemTests = require('../lib/system-tests').default

describe('Browser Crash Handling', () => {
  systemTests.setup({
    settings: {
      e2e: {},
    },
  })

  // It should fail the chrome_tab_crash spec, but the simple spec should run and succeed
  context('when the tab crashes in chrome', () => {
    systemTests.it('fails', {
      browser: 'chrome',
      spec: 'chrome_tab_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // It should fail the chrome_tab_crash spec, but the simple spec should run and succeed
  context('when the tab crashes in electron', () => {
    systemTests.it('fails', {
      browser: 'electron',
      spec: 'chrome_tab_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // It should fail the chrome_tab_crash spec, but the simple spec should run and succeed
  context('when the browser process crashes in chrome', () => {
    systemTests.it('fails', {
      browser: 'chrome',
      spec: 'chrome_process_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      // FIXME: this test fails with video off due to a race condition on setting the spec. @see https://github.com/cypress-io/cypress/issues/27062.
      config: {
        video: true,
      },
    })
  })

  // If chrome crashes, all of cypress crashes when in electron
  context('when the browser process crashes in electron', () => {
    systemTests.it('fails', {
      browser: 'electron',
      spec: 'chrome_process_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
