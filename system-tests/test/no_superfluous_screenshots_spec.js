const { fs } = require('@packages/server/lib/util/fs')
const path = require('path')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

// https://github.com/cypress-io/cypress/issues/9209
describe('no superfluous screenshots when afterEach() failed', () => {
  systemTests.setup()

  systemTests.it('2 screenshots', {
    spec: 'no_superfluous_screenshots.cy.js',
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
