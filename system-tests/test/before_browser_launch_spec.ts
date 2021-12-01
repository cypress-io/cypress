import Fixtures from '../lib/fixtures'
import systemTests from '../lib/system-tests'
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
    project: 'chrome-browser-preferences',
    snapshot: true,
    spec: 'spec.js',
  })

  systemTests.it('can add extensions', {
    spec: 'spec.js',
    config: {
      video: false,
    },
    headed: true,
    project: 'browser-extensions',
    sanitizeScreenshotDimensions: true,
    snapshot: true,
    onRun: async (exec) => {
      Fixtures.scaffoldProject('plugin-extension')
      await exec()
    },
  })
})
