/* eslint-disable no-console */

require('@packages/coffee/register')

const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const minimist = require('minimist')
const fs = require('../../lib/util/fs')
const glob = require('../../lib/util/glob')

const options = minimist(process.argv.slice(2))

const { size, reset, snapshots } = options

const removeChunkPrefixes = () => {
  const forwardSlashNumUnderscoreRe = /(\/\d_)/

  const renameFiles = (pattern) => {
    return glob(pattern)
    .map((spec) => {
      return fs.renameAsync(spec, spec.replace(forwardSlashNumUnderscoreRe, '/'))
    })
  }

  return Promise.join(
    renameFiles('test/e2e/**/*'),
    renameFiles('__snapshots__/**/*')
  )
}

const renameSnapshotsToMatchSpecs = () => {
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
}

if (reset) {
  return removeChunkPrefixes()
}

if (snapshots) {
  return renameSnapshotsToMatchSpecs()
}

glob('test/e2e/**/*')
.then((specs) => {
  if (!size) {
    console.error('must include --size for calculating chunk size')
  }

  return _.chunk(specs, size)
})
.map((chunks, index) => {
  index += 1

  return Promise
  .map(chunks, (spec) => {
    const folder = path.dirname(spec)
    const specName = path.basename(spec)
    const renamedSpec = `${index}_${specName}`

    return fs.renameAsync(spec, path.join(folder, renamedSpec))
  })
})
