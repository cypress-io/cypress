const { changeCatagories, userFacingChanges } = require('../../../scripts/semantic-commits/change-categories')
const fs = require('node:fs/promises')
const path = require('path')

const CHANGESET_DIR = path.join(__dirname, '..', '..', '..', 'cli', 'changesets')

const gracefullyHandle = async (promises) => {
  let result
  const warnings = []
  const errs = []

  try {
    const handledPromises = promises.map((p) => {
      return p.catch((err) => {
        errs.push(err)
      })
    })

    result = await Promise.all(handledPromises)
  } catch (err) {
    errs.push(err)
  }

  if (warnings.length) {
    warnings.forEach((warn) => console.warn(warn))
  }

  if (errs.length) {
    errs.forEach((err) => console.error(err))
    exit(1)
  }

  return result
}

module.exports = {
  CHANGESET_DIR,
  changeCatagories,
  userFacingChanges,
  getChangesets: async () => {
    return fs.readdir(CHANGESET_DIR)
  },
  parseChangeset: async (changesetFilename) => {
    let contents = await fs.readFile(path.join(CHANGESET_DIR, changesetFilename), 'utf8')

    /**
     * EXPECTED FORMAT:
     * ---
     * type: ?
     * ---
     *
     * entry...
     */
    contents = contents.split('\n')

    contents.shift() // remove ---
    const type = contents.shift().replace('type:', '').trim()

    contents.shift() // remove ---
    const entry = contents.join('\n').trim()

    return {
      type,
      entry,
      // used to compare to the filename returned by git which uses forward slashes
      changesetFilename: `cli/changesets/${changesetFilename}`,
    }
  },
  deleteChangesets: async () => {
    const changesets = await gracefullyHandle([this.getChangesets])

    gracefullyHandle(changesets.map((changesetFilename) => {
      return fs.unlink(changesetFilename)
    }))
  },
  verifyChangesets: async () => {
  },
}
