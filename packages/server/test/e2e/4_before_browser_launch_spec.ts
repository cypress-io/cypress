import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'
import browserUtils from '../../lib/browsers/utils'

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
