import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

const beforeBrowserLaunchProject = Fixtures.projectPath('plugin-before-browser-launch-deprecation')

describe('deprecated before:browser:launch args', () => {
  e2e.setup()

  e2e.it('fails when adding unknown properties to launchOptions', {
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-unknown-properties',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js',
    expectedExitCode: 1,
    snapshot: true,
  })

  e2e.it('push and no return - warns user exactly once', {
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-undefined-mutate-array',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js',
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: ['--foo', '--bar'],
  })

  e2e.it('using non-deprecated API - no warning', {
    // TODO: implement webPreferences.additionalArgs here
    // once we decide if/what we're going to make the implemenation
    // SUGGESTION: add this to Cypress.browser.args which will capture
    // whatever args we use to launch the browser
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-launch-options-mutate-only-args-property',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js',
    snapshot: true,
    stdoutExclude: 'Deprecation Warning:',
    psInclude: ['--foo', '--bar'],
  })

  e2e.it('concat return returns once per spec', {
    // TODO: implement webPreferences.additionalArgs here
    // once we decide if/what we're going to make the implemenation
    // SUGGESTION: add this to Cypress.browser.args which will capture
    // whatever args we use to launch the browser
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-array-mutation',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js,app_spec2.js',
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
  })

  e2e.it('no mutate return', {
    // TODO: implement webPreferences.additionalArgs here
    // once we decide if/what we're going to make the implemenation
    // SUGGESTION: add this to Cypress.browser.args which will capture
    // whatever args we use to launch the browser
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-new-array-without-mutation',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js',
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: '--foo',
  })

  // TODO: these errors could be greatly improved by the code frame
  // improvements - because we "wrap" the user error with our own
  // error which reads strangely - the message + stack are both
  // printed. we should print that we are aborting the run because
  // the before:browser:launch handler threw an error / rejected
  e2e.it('displays errors thrown and aborts the run', {
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'throw-explicit-error',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js,app_spec2.js',
    expectedExitCode: 1,
    snapshot: true,
  })

  // TODO: these errors could be greatly improved by the code frame
  // improvements - because we "wrap" the user error with our own
  // error which reads strangely - the message + stack are both
  // printed. we should print that we are aborting the run because
  // the before:browser:launch handler threw an error / rejected
  e2e.it('displays promises rejected and aborts the run', {
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'reject-promise',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.js,app_spec2.js',
    expectedExitCode: 1,
    snapshot: true,
  })
})
