const fs = require('node:fs/promises')
const path = require('path')
const uuid = require('uuid')

const CHANGESET_DIR = path.join(__dirname, '..', '..', '..', 'cli', 'changesets')

const gracefullyHandle = async (promises) => {
  let result
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

  if (errs.length) {
    errs.forEach((err) => console.error(err))
    process.exit(1)
  }

  return result
}

const getChangesets = async () => {
  return fs.readdir(CHANGESET_DIR)
}

module.exports = {
  CHANGESET_DIR,
  addChangeset: async (changeType, message) => {
    const changeEntry = [
      '---',
      `type: ${changeType}`,
      '---',
      '',
      message,
    ].join('\n')
    const fileName = `${uuid.v4()}.md`
    const changesetPath = path.join(CHANGESET_DIR, fileName)

    await fs.writeFile(changesetPath, changeEntry)

    console.log('Added the following changeset to', changesetPath, '\n')
    console.log(changeEntry)
  },
  getChangesets,
  deleteChangesets: async () => {
    const changesets = await getChangesets()

    gracefullyHandle(changesets.map((changesetFilename) => {
      return fs.unlink(path.join(CHANGESET_DIR, changesetFilename))
    }))
  },
  parseChangesets: async () => {
    const changesets = await getChangesets()

    return Promise.all(changesets.map(async (changesetFilename) => {
      let contents = await fs.readFile(path.join(CHANGESET_DIR, changesetFilename), 'utf8')

      /**
     * EXPECTED FORMAT:
     * ---
     * type: ?
     * ---
     *
     * message
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
    }))
  },
}
