import Bluebird from 'bluebird'
import _ from 'lodash'
import rp from 'request-promise'
import * as url from 'url'
import { agent, connect } from '@packages/network'

type RetryOptions = {
  retryInterval: number[]
  onRetry: Function
}

export const retryIsListening = (urlStr: string, options: RetryOptions) => {
  const { retryInterval, onRetry } = options

  const intervals = _.clone(retryInterval)

  const run = () => {
    return isListening(urlStr)
    .catch((err) => {
      const delay = intervals.pop()

      if (!delay) {
        throw err
      }

      onRetry({
        delay,
        attempt: retryInterval.length - intervals.length,
        remaining: intervals.length + 1,
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

  if (process.env.HTTP_PROXY) {
    // cannot make arbitrary connections behind a proxy, attempt HTTP/HTTPS
    return rp({
      url: urlStr,
      // @ts-ignore
      agent,
      proxy: null,
    })
    .catch({ name: 'StatusCodeError' }, () => {}) // we just care if it can connect, not if it's a valid resource
  }

  return connect.getAddress(Number(port), String(hostname))
}
