import contentType from 'content-type'
import type { IncomingMessage } from 'http'

export const getContentType = (res: IncomingMessage): string | undefined => {
  try {
    return contentType.parse(res).type
  } catch {
    // https://github.com/cypress-io/cypress/issues/3101
    return res.headers['content-type']
  }
}
