const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e before:browser:launch', () => {
  e2e.setup()

  e2e.it('modifies preferences on disk if DNE', {
    browser: 'chrome',
    config: {
      video: false,
    },
    project: Fixtures.projectPath('chrome-browser-preferences'),
    expectedExitCode: 0,
    snapshot: true,
    spec: 'spec.js',
  })

  e2e.it.only('can set fullscreen', {
    project: Fixtures.projectPath('plugin-event-fullscreen'),
    spec: '*',
    expectedExitCode: 0,
    headed: true,
  })
})
