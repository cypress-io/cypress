const rp = require('@cypress/request-promise')
const { fs } = require('../util/fs')

export = {
  send (pathToFile: string, url: string) {
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
