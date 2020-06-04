const path = require('path')
const Promise = require('bluebird')
const Fixtures = require('../support/helpers/fixtures')
const e2e = require('../support/helpers/e2e').default
let fs = require('../../lib/util/fs')

fs = Promise.promisifyAll(fs)

const noScaffoldingPath = Fixtures.projectPath('no-scaffolding')
const supportPath = path.join(noScaffoldingPath, 'cypress', 'support')

describe('e2e new project', () => {
  e2e.setup()

  it('passes', function () {
    return fs
    .statAsync(supportPath)
    .then(() => {
      throw new Error('support folder should not exist')
    }).catch(() => {
      return e2e.exec(this, {
        project: noScaffoldingPath,
        sanitizeScreenshotDimensions: true,
        snapshot: true,
      })
      .then(() => {
        return fs.statAsync(supportPath)
      })
    })
  })
})
