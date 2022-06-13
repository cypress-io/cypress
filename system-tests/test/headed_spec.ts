import systemTests, { BrowserName } from '../lib/system-tests'

describe('e2e headed', function () {
  systemTests.setup()

  const browserList: BrowserName[] = ['chrome', 'firefox', 'electron']

  browserList.forEach(function (browser) {
    it(`runs multiple specs in headed mode - [${browser}]`, async function () {
      await systemTests.exec(this, {
        project: 'e2e',
        headed: true,
        browser,
        spec: 'a_record.cy.js,b_record.cy.js,simple_passing.cy.js',
        expectedExitCode: 0,
      })
    })
  })
})
