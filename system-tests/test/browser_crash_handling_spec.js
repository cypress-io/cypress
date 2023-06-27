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
    systemTests.it('fails w/ video off', {
      browser: 'chrome',
      spec: 'chrome_process_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      config: {
        video: false,
      },
      onStdout: (stdout) => {
        // the location of this warning is non-deterministic
        return stdout.replace('The automation client disconnected. Cannot continue running tests.\n', '')
      },
    })

    systemTests.it('fails w/ video on', {
      browser: 'chrome',
      spec: 'chrome_process_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      config: {
        video: true,
      },
      onStdout: (stdout) => {
        // the location of this warning is non-deterministic
        return stdout.replace('The automation client disconnected. Cannot continue running tests.\n', '')
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
