import charset from 'charset'
import iconv from 'iconv-lite'
import type Debug from 'debug'
import type { IncomingHttpHeaders } from 'http'

// https://github.com/cypress-io/cypress/issues/1543
export function getNodeCharsetFromResponse (headers: IncomingHttpHeaders, body: Buffer, debug: Debug.Debugger) {
  const httpCharset = (charset(headers, body, 1024) || '').toLowerCase()

  debug('inferred charset from response %o', { httpCharset })
  if (iconv.encodingExists(httpCharset)) {
    return httpCharset
  }

  // browsers default to latin1
  return 'latin1'
}
