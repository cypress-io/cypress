import _ from 'lodash'
import Bluebird from 'bluebird'
import debugModule from 'debug'
import rp from '@cypress/request-promise'
import * as url from 'url'
import { agent, connect, shouldProxyForUrl } from '@packages/network'

const debug = debugModule('cypress:server:ensure-url')

type RetryOptions = {
  retryIntervals: number[]
  onRetry(o: { delay: number, attempt: number, remaining: number }): void
}

export const retryIsListening = (urlStr: string, options: RetryOptions) => {
  const { retryIntervals, onRetry } = options

  const delaysRemaining = _.clone(retryIntervals)

  const run = () => {
    debug('checking that baseUrl is available', {
      baseUrl: urlStr,
      delaysRemaining,
      retryIntervals,
    })

    return isListening(urlStr)
    .catch((err) => {
      const delay = delaysRemaining.shift()

      if (!delay) {
        throw err
      }

      onRetry({
        delay,
        attempt: retryIntervals.length - delaysRemaining.length,
        remaining: delaysRemaining.length + 1,
      })

      return Bluebird.delay(delay)
      .then(() => {
        return run()
      })
    })
  }

  return run()
}

export const isListening = (urlStr: string) => {
  // takes a urlStr and verifies the hostname + port is listening
  let { hostname, protocol, port } = url.parse(urlStr)

  if (port == null) {
    port = protocol === 'https:' ? '443' : '80'
  }

  if (process.env.HTTP_PROXY && shouldProxyForUrl(urlStr)) {
    // cannot make arbitrary connections behind a proxy, attempt HTTP/HTTPS.
    // urls excluded from the proxy via NO_PROXY (e.g. localhost, which is the
    // component testing dev server and is in NO_PROXY by default) fall through
    // to a direct connection below so we don't route them through the proxy.
    // For some reason, TypeScript gets confused by the "agent" parameter
    // and required double ts-ignore to allow it on local machines and on CI
    // @ts-ignore
    return rp({
      url: urlStr,
      // @ts-ignore
      agent,
      proxy: null,
    })
    .catch({ name: 'StatusCodeError' }, () => {}) // we just care if it can connect, not if it's a valid resource
  }

  // With https://github.com/cypress-io/cypress/pull/32633, the @packages/network package has refactored some methods to use
  // native promises. This method wraps the native promise in a Bluebird promise to ensure that the method returns a Bluebird promise
  // until we are able to refactor it.
  return new Bluebird((resolve, reject) => {
    connect.getAddress(Number(port), String(hostname))
    .then(resolve)
    .catch(reject)
  })
}
