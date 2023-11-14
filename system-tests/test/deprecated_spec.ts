import systemTests from '../lib/system-tests'

const beforeBrowserLaunchProject = 'plugin-before-browser-launch-deprecation'

const includesString = (s: string) => {
  return (stdout: string) => {
    expect(stdout).to.include(s)
  }
}

const excludesString = (s: string) => {
  return (stdout: string) => {
    expect(stdout).to.not.include(s)
  }
}

describe('deprecated before:browser:launch args', () => {
  systemTests.setup()

  systemTests.it('fails when adding unknown properties to launchOptions', {
    browser: '!webkit', // TODO(webkit): fix+unskip (add executeBeforeBrowserLaunch to WebKit)
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-unknown-properties',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js',
    expectedExitCode: 1,
    snapshot: true,
  })

  systemTests.it('push and no return - warns user exactly once', {
    browser: '!webkit', // TODO(webkit): fix+unskip (add executeBeforeBrowserLaunch to WebKit)
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-undefined-mutate-array',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js',
    snapshot: true,
    onStdout: includesString('Deprecation Warning:'),
  })

  systemTests.it('using non-deprecated API - no warning', {
    // TODO: implement webPreferences.additionalArgs here
    // once we decide if/what we're going to make the implementation
    // SUGGESTION: add this to Cypress.browser.args which will capture
    // whatever args we use to launch the browser
    browser: '!webkit', // throws in WebKit since it rejects unsupported arguments
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-launch-options-mutate-only-args-property',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js',
    snapshot: true,
    onRun: (exec, browser) => {
      if (browser === 'electron') {
        return exec({ originalTitle: `deprecated before:browser:launch args / using non-deprecated API - no warning - [electron]` })
      }

      return exec({ originalTitle: `deprecated before:browser:launch args / using non-deprecated API - no warning - [firefox,chromium]` })
    },
    onStdout: excludesString('Deprecation Warning:'),
  })

  systemTests.it('concat return returns once', {
    // TODO: implement webPreferences.additionalArgs here
    // once we decide if/what we're going to make the implementation
    // SUGGESTION: add this to Cypress.browser.args which will capture
    // whatever args we use to launch the browser
    browser: '!webkit', // throws in WebKit since it rejects unsupported arguments
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-array-mutation',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js,app_spec2.js',
    snapshot: true,
    onRun: (exec, browser) => {
      if (browser === 'electron') {
        return exec({ originalTitle: `deprecated before:browser:launch args / concat return returns once per spec - [electron]` })
      }

      return exec({ originalTitle: `deprecated before:browser:launch args / concat return returns once per test run - [firefox,chromium]` })
    },
    onStdout: includesString('Deprecation Warning:'),
  })

  // TODO: fix/remove this test, it should be warning but is not
  // https://github.com/cypress-io/cypress/issues/20436
  systemTests.it.skip('no mutate return', {
    // TODO: implement webPreferences.additionalArgs here
    // once we decide if/what we're going to make the implementation
    // SUGGESTION: add this to Cypress.browser.args which will capture
    // whatever args we use to launch the browser
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-new-array-without-mutation',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js',
    snapshot: true,
    onStdout: includesString('Deprecation Warning:'),
  })

  // TODO: these errors could be greatly improved by the code frame
  // improvements - because we "wrap" the user error with our own
  // error which reads strangely - the message + stack are both
  // printed. we should print that we are aborting the run because
  // the before:browser:launch handler threw an error / rejected
  systemTests.it('displays errors thrown and aborts the run', {
    browser: '!webkit', // TODO(webkit): fix+unskip (add executeBeforeBrowserLaunch to WebKit)
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'throw-explicit-error',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js,app_spec2.js',
    expectedExitCode: 1,
    snapshot: true,
  })

  // TODO: these errors could be greatly improved by the code frame
  // improvements - because we "wrap" the user error with our own
  // error which reads strangely - the message + stack are both
  // printed. we should print that we are aborting the run because
  // the before:browser:launch handler threw an error / rejected
  systemTests.it('displays promises rejected and aborts the run', {
    browser: '!webkit', // TODO(webkit): fix+unskip (add executeBeforeBrowserLaunch to WebKit)
    config: {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'reject-promise',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app.cy.js,app_spec2.js',
    expectedExitCode: 1,
    snapshot: true,
  })
})
