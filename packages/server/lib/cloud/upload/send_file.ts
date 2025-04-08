const rp = require('@cypress/request-promise')
const { fs } = require('../../util/fs')

export const sendFile = (filePath: string, uploadUrl: string) => {
  return fs
  .readFileAsync(filePath)
  .then((buf) => {
    return rp({
      url: uploadUrl,
      method: 'PUT',
      body: buf,
    })
  })
}
