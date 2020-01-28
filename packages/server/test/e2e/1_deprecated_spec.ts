const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('deprecated before:browser:launch args', () => {
  e2e.setup()
  e2e.it('push and no return - warns user exactly once', {
    browser: '!electron',
    config: {
      video: false,
    },
    project: Fixtures.projectPath('plugin-event-deprecated'),
    spec: '*',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: ['--foo', '--bar'],
  })

  e2e.it('using non-deprecated API - no warning', {
    browser: '!electron',
    config: {
      video: false,
      env: { 'NO_WARNING': 1 },
    },
    project: Fixtures.projectPath('plugin-event-deprecated'),
    spec: '*',
    expectedExitCode: 0,
    snapshot: true,
    stdoutExclude: 'Deprecation Warning:',
    psInclude: ['--foo', '--bar'],
  })

  e2e.it('concat return', {
    browser: '!electron',
    config: {
      video: false,
      env: { 'CONCAT_RETURN': 1 },
    },
    project: Fixtures.projectPath('plugin-event-deprecated'),
    spec: '*',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: '--foo',
  })

  e2e.it('no mutate return', {
    browser: '!electron',
    config: {
      video: false,
      env: { 'NO_MUTATE_RETURN': 1 },
    },
    project: Fixtures.projectPath('plugin-event-deprecated'),
    spec: '*',
    expectedExitCode: 0,
    snapshot: true,
    stdoutInclude: 'Deprecation Warning:',
    psInclude: '--foo',
  })
})
