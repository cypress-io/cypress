const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

const beforeBrowserLaunchProject = Fixtures.projectPath('plugin-before-browser-launch-deprecation')

describe('deprecated before:browser:launch args', () => {
  e2e.setup()

  // NOTE: @bkucera im not sure what you were trying to
  // do in this test, but i don't believe you ever wrote
  // the before:browser:launch callback in the project's
  // plugin file.
  // theres no saved snapshot content either
  e2e.it.skip('warn in electron, but ignore arguments', {
    browser: 'electron',
    config: {
      video: false,
    },
    project: beforeBrowserLaunchProject,
    spec: '*',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    // psInclude: ['--foo', '--bar'],
  })

  e2e.it('push and no return - warns user exactly once', {
    browser: '!electron',
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-undefined-mutate-array',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.coffee',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: ['--foo', '--bar'],
  })

  e2e.it('using non-deprecated API - no warning', {
    browser: '!electron',
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-options-mutate-only-args-property',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.coffee',
    expectedExitCode: 0,
    snapshot: true,
    stdoutExclude: 'Deprecation Warning:',
    psInclude: ['--foo', '--bar'],
  })

  e2e.it('concat return returns once per spec', {
    browser: '!electron',
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-array-mutation',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.coffee,app_spec2.coffee',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: '--foo',
  })

  e2e.it('no mutate return', {
    browser: '!electron',
    config: {
      video: false,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-new-array-without-mutation',
      },
    },
    project: beforeBrowserLaunchProject,
    spec: 'app_spec.coffee',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: '--foo',
  })
})
