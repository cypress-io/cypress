const path = require('path')
const { fs } = require('./util/fs')

module.exports = {
  readFile (projectRoot, file, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const readFn = path.extname(filePath) === '.json' ? fs.readJsonAsync : fs.readFileAsync

    return readFn(filePath, options.encoding === undefined ? 'utf8' : options.encoding)
    .then((contents) => {
      return {
        contents: options.encoding === null ? contents.toString('base64') : contents,
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
