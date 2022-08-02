const path = require('path')
const { fs } = require('./util/fs')

module.exports = {
  readFile (projectRoot, file, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const readFn = (path.extname(filePath) === '.json' && options.encoding !== null) ? fs.readJsonAsync : fs.readFileAsync

    // https://github.com/cypress-io/cypress/issues/1558
    // If no encoding is specified, then Cypress has historically defaulted
    // to `utf8`, because of it's focus on text files. This is in contrast to
    // NodeJs, which defaults to binary. We allow users to pass in `null`
    // to restore the default node behavior.
    return readFn(filePath, options.encoding === undefined ? 'utf8' : options.encoding)
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
  },

  writeFile (projectRoot, file, contents, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const writeOptions = {
      encoding: options.encoding === undefined ? 'utf8' : options.encoding,
      flag: options.flag || 'w',
    }

    return fs.outputFile(filePath, contents, writeOptions)
    .then(() => {
      return {
        contents,
        filePath,
      }
    })
    .catch((err) => {
      err.filePath = filePath
      throw err
    })
  },
}
