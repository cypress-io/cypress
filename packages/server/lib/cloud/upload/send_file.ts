import rp from '@cypress/request-promise'
import { strictAgent } from '@packages/network'
import { fs } from '../../util/fs'

export const sendFile = (filePath: string, uploadUrl: string) => {
  return fs
  .readFileAsync(filePath)
  .then((buf) => {
    return rp({
      url: uploadUrl,
      method: 'PUT',
      body: buf,
      agent: strictAgent,
      proxy: null,
      rejectUnauthorized: true,
    })
  })
}
