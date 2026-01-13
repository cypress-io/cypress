import contentType from 'content-type'
import type { IncomingMessage } from 'http'

const getContentType = (res: IncomingMessage): string | undefined => {
  try {
    return contentType.parse(res).type
  } catch (err) {
    // https://github.com/cypress-io/cypress/issues/3101
    const contentTypeHeader = res.headers['content-type']

    return Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader
  }
}

const hasContentType = (res: IncomingMessage, type: string): boolean => {
  // does the response object have a content-type
  // that matches what we expect
  try {
    return contentType.parse(res).type === type
  } catch (err) {
    return false
  }
}

export { getContentType, hasContentType }

export default {
  getContentType,
  hasContentType,
}

module.exports = {
  getContentType,
  hasContentType,
}
