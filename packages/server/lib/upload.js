const rp = require('@cypress/request-promise')
const { fs } = require('./util/fs')

module.exports = {
  send (pathToFile, url) {
    return fs
    .readFileAsync(pathToFile)
    .then((buf) => {
      return rp({
        url,
        method: 'PUT',
        body: buf,
      })
    })
  },
}
