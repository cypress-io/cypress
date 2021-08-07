const path = require('path')
const Fixtures = require('../support/helpers/fixtures')
const e2e = require('../support/helpers/e2e').default
const { fs } = require('../../lib/util/fs')

const noScaffoldingPath = Fixtures.projectPath('no-scaffolding')
const supportPath = path.join(noScaffoldingPath, 'cypress', 'support')
const pluginsPath = path.join(noScaffoldingPath, 'cypress', 'plugins')

describe('e2e new project', () => {
  e2e.setup()

  it('creates a sample supportFile & a sample pluginsFile', function () {
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
        return Promise.all([fs.statAsync(supportPath), fs.statAsync(pluginsPath)])
      })
    })
  })
})
