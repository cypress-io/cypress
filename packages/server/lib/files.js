const path = require('path')
const fs = require('./util/fs')

module.exports = {
  readFile (projectRoot, file, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const readFn = path.extname(filePath) === '.json' ? fs.readJsonAsync : fs.readFileAsync

    return readFn(filePath, options.encoding || 'utf8')
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
      encoding: options.encoding || 'utf8',
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
