import { NetStubbingState } from './types'
import { URL } from 'url'
import minimatch from 'minimatch'

/**
 * Returns `true` if there is any chance that a request for `host` could match a route defined in `state`.
 * @param host `hostname:port`
 */
export function isHostInterceptable (host: string, { routes }: Pick<NetStubbingState, 'routes'>) {
  const [hostname, portStr] = host.split(':')
  const port = Number(portStr)

  for (const { routeMatcher } of routes) {
    if (routeMatcher.port) {
      if (Array.isArray(routeMatcher.port) && !routeMatcher.port.includes(port)) {
        continue // excluded by port list mismatch
      }

      if (!Array.isArray(routeMatcher.port) && routeMatcher.port !== port) {
        continue // excluded by port mismatch
      }
    }

    if (!routeMatcher.hostname && !routeMatcher.url) {
      return true // route has no constraints on host, could match
    }

    if (routeMatcher.hostname) {
      if (routeMatcher.hostname instanceof RegExp && routeMatcher.hostname.test(hostname)) {
        return true // hostname RegExp is a match
      }

      if (routeMatcher.hostname === hostname) {
        return true // hostname is an exact match
      }
    }

    if (routeMatcher.url) {
      if (routeMatcher.url instanceof RegExp) {
        return true // possible that the RegExp could match a URL
      }

      if (host.includes(routeMatcher.url)) {
        return true // possible for substring to match
      }

      try {
        const url = new URL(routeMatcher.url)

        if (minimatch(host, url.host) || minimatch(hostname, url.hostname)) {
          return true // host could match
        }
      } catch (e) {
        return true // invalid URL, so partial URL, could possibly match
      }
    }
  }

  return false // ruled out all possibilities for a match
}
