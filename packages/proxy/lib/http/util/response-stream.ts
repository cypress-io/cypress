import charset from 'charset'
import iconv from 'iconv-lite'
import type Debug from 'debug'
import type { IncomingHttpHeaders } from 'http'

export function getNodeCharsetFromResponse (headers: IncomingHttpHeaders, body: Buffer, debug: Debug.Debugger) {
  const httpCharset = (charset(headers, body, 1024) || '').toLowerCase()

  debug('inferred charset from response %o', { httpCharset })
  if (iconv.encodingExists(httpCharset)) {
    return httpCharset
  }

  return 'latin1'
}
