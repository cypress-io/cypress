const { fs } = require('./fs')
const os = require('os')
const path = require('path')
const trash = require('trash')
const Promise = require('bluebird')

module.exports = {
  folder (pathToFolder) {
    return fs.statAsync(pathToFolder)
    .then(() => {
      if (os.platform() === 'linux') {
        return fs.emptyDir(pathToFolder)
      }

      return Promise.map(fs.readdirAsync(pathToFolder), (item) => {
        return trash([path.join(pathToFolder, item)])
      })
    }).catch({ code: 'ENOENT' }, () => {})
  },
}
