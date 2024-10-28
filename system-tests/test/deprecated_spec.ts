import systemTests from '../lib/system-tests'

const beforeBrowserLaunchProject = 'plugin-before-browser-launch-deprecation'

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
