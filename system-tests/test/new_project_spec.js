const path = require('path')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default
const { fs } = require('@packages/server/lib/util/fs')

const noScaffoldingPath = Fixtures.projectPath('no-scaffolding')
const supportPath = path.join(noScaffoldingPath, 'cypress', 'support')

describe('e2e new project', () => {
  systemTests.setup()

  it('passes', function () {
    return fs
    .statAsync(supportPath)
    .then(() => {
      throw new Error('support folder should not exist')
    }).catch(() => {
      return systemTests.exec(this, {
        project: 'no-scaffolding',
        sanitizeScreenshotDimensions: true,
        snapshot: true,
      })
      .then(() => {
        return fs.statAsync(supportPath)
      })
      .catch((err) => {
        expect(err.code).eq('ENOENT')
      })
    })
  })
})
