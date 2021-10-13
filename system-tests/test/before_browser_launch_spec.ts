import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
import browserUtils from '@packages/server/lib/browsers/utils'

const browser = {
  name: 'chrome',
  channel: 'stable',
}
const isTextTerminal = true // we're always in run mode
const PATH_TO_CHROME_PROFILE = browserUtils.getProfileDir(browser, isTextTerminal)

describe('e2e before:browser:launch', () => {
  systemTests.setup()

  systemTests.it('modifies preferences on disk if DNE', {
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

  systemTests.it('can add extensions', {
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
