const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const tmp = Promise.promisifyAll(require('tmp'))

const run = require('./exec/run')

module.exports = {
  run (options = {}) {
    return tmp.fileAsync().then((outputPath) => {
      options.outputPath = outputPath
      return run.start(options).then(() => {
        return fs.readJsonAsync(outputPath)
      })
    })
  },
}
