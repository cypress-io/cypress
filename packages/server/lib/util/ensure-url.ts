import * as url from 'url'
import * as rp from 'request-promise'
import { agent, connect } from '@packages/network'

export function isListening (urlStr: string) {
  // takes a urlStr and verifies the hostname + port is listening
  let { hostname, protocol, port } = url.parse(urlStr)

  if (port == null) {
    port = protocol === 'https:' ? '443' : '80'
  }

  if (process.env.HTTP_PROXY) {
    // cannot make arbitrary connections behind a proxy, attempt HTTP/HTTPS
    return rp({
      url: urlStr,
      agent,
      proxy: null,
    })
    .catch({ name: 'StatusCodeError' }, () => {}) // we just care if it can connect, not if it's a valid resource
  }

  return connect.getAddress(Number(port), String(hostname))
}
