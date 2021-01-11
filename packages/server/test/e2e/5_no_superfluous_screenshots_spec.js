const { fs } = require('../../lib/util/fs')
const path = require('path')
const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

// https://github.com/cypress-io/cypress/issues/9209
describe('no superfluous screenshots when afterEach() failed', () => {
  e2e.setup()

  e2e.it('2 screenshots', {
    spec: 'no_superfluous_screenshots_spec.js',
    onRun (exec) {
      return exec().
      then(() => {
        const screenshotsPath = path.join(e2ePath, 'cypress', 'screenshots', 'no_superfluous_screenshots_spec.js')

        return fs.readdir(screenshotsPath).then((files) => {
          expect(files.length).to.eq(2)
        })
      })
    },
  })
})
