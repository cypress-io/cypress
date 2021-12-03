const path = require('path')
const { fs } = require('./util/fs')

module.exports = {
  readFile (projectRoot, file, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const readFn = (path.extname(filePath) === '.json' && options.encoding !== null) ? fs.readJsonAsync : fs.readFileAsync
    const readFileAbortController = new AbortController()

    // https://github.com/cypress-io/cypress/issues/1558
    // If no encoding is specified, then Cypress has historically defaulted
    // to `utf8`, because of it's focus on text files. This is in contrast to
    // NodeJs, which defaults to binary. We allow users to pass in `null`
    // to restore the default node behavior.

    const readOptions = {
      encoding: options.encoding === undefined ? 'utf8' : options.encoding,
      signal: readFileAbortController.signal,
    }

    let readFileTimeout

    if (options.timeout !== undefined) {
      readFileTimeout = setTimeout(() => {
        readFileAbortController.abort()
      }, options.timeout)
    }

    return readFn(filePath, readOptions)
    .then((contents) => {
      return {
        contents,
        filePath,
      }
    })
    .catch((err) => {
      err.filePath = filePath

      throw err
    })
    .finally(() => {
      clearTimeout(readFileTimeout)
    })
  },

  writeFile (projectRoot, file, contents, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const writeFileAbortController = new AbortController()
    const writeOptions = {
      encoding: options.encoding === undefined ? 'utf8' : options.encoding,
      flag: options.flag || 'w',
      signal: writeFileAbortController.signal,
    }

    let writeFileTimeout

    if (options.timeout !== undefined) {
      writeFileTimeout = setTimeout(() => {
        writeFileAbortController.abort()
      }, options.timeout)
    }

    return fs.outputFile(filePath, contents, writeOptions)
    .then(() => {
      return {
        filePath,
      }
    })
    .catch((err) => {
      err.filePath = filePath

      throw err
    })
    .finally(() => {
      clearTimeout(writeFileTimeout)
    })
  },
}
