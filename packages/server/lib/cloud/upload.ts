const rp = require('@cypress/request-promise')
import { createReadStream } from 'fs'

export = {
  send (pathToFile: string, url: string) {
    return rp({
      url,
      method: 'PUT',
      body: createReadStream(pathToFile),
    })
  },
}
