import systemTests, { BrowserName } from '../lib/system-tests'

describe('e2e headed', function () {
  systemTests.setup()

  const browserList: BrowserName[] = ['chrome', 'firefox', 'electron']

  browserList.forEach(function (browser) {
    it(`runs multiple specs in headed mode - [${browser}]`, async function () {
      await systemTests.exec(this, {
        project: 'cypress-in-cypress',
        headed: true,
        browser,
        spec: 'dom-content.spec.js,withFailure.spec.js',
        snapshot: true,
        expectedExitCode: 1,
      })
    })
  })
})
