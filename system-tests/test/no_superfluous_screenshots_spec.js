const { fs } = require('@packages/server/lib/util/fs')
const path = require('path')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

// https://github.com/cypress-io/cypress/issues/9209
describe('no superfluous screenshots when afterEach() failed', () => {
  systemTests.setup()

  // The fixture intentionally fails a test and its afterEach hook on the first
  // attempt, then passes on retry. That race between the failed-test retry and
  // the failed-afterEach retry occasionally leaves the test counted as failed,
  // so the process exits 1 instead of 0. The screenshot count is stable; only
  // the exit code flakes. Retry at the harness level to absorb it.
  systemTests.it('2 screenshots', {
    spec: 'no_superfluous_screenshots.cy.js',
    retries: 2,
    onRun (exec) {
      return exec().
      then(() => {
        const screenshotsPath = path.join(e2ePath, 'cypress', 'screenshots', 'no_superfluous_screenshots.cy.js')

        return fs.readdir(screenshotsPath).then((files) => {
          expect(files.length).to.eq(2)
        })
      })
    },
  })
})
