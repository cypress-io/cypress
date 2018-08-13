require('@packages/coffee/register')

const path = require('path')
const fs = require('../../lib/util/fs')
const glob = require('../../lib/util/glob')

glob('test/e2e/**/*')
.map((spec) => {
  spec += '.js'

  const specName = path.basename(spec)

  const pathToSnapshot = path.resolve(
    __dirname, '..', '..', '__snapshots__', specName.slice(2)
  )

  const pathToRenamedSnapshot = path.join(
    path.dirname(pathToSnapshot),
    specName
  )

  return fs.renameAsync(pathToSnapshot, pathToRenamedSnapshot)
})
.catchReturn({ code: 'ENOENT' }, null)
