const browserUtils = require('../../lib/browsers/utils')
const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

const browser = {
  name: 'chrome',
  channel: 'stable',
}
const isTextTerminal = true // we're always in run mode
const PATH_TO_CHROME_PROFILE = browserUtils.getProfileDir(browser, isTextTerminal)

describe('e2e before:browser:launch', () => {
  e2e.setup()

  e2e.it('modifies preferences on disk if DNE', {
    browser: 'chrome',
    config: {
      video: false,
      env: {
        PATH_TO_CHROME_PROFILE,
      },
    },
    project: Fixtures.projectPath('chrome-browser-preferences'),
    snapshot: true,
    spec: 'spec.js',
  })

  e2e.it('can add extensions', {
    spec: 'spec.js',
    config: {
      video: false,
    },
    headed: true,
    project: Fixtures.projectPath('browser-extensions'),
    sanitizeScreenshotDimensions: true,
    snapshot: true,
  })
})
