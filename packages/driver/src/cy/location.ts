import { $Location, LocationObject } from '../cypress/location'
import type { StateFunc } from '../cypress/state'
import $utils from '../cypress/utils'

// How often we re-request the location from the cross-origin AUT, and how long
// we keep trying before giving up. The request/reply is a local postMessage
// round-trip (handled by the `cross-origin.js` injection), so it normally
// resolves within a few milliseconds. We retry because, during multi-origin
// redirect chains (e.g. OAuth/OIDC login callbacks), the AUT can navigate again
// before its reply is delivered, or the injected listener may not yet be
// registered when we make the first request. Without bounding this, a single
// dropped reply would hang the page-load wait until pageLoadTimeout (default
// 60s) and surface as a misleading "remote page to load" timeout.
// See https://github.com/cypress-io/cypress/issues/26020.
const CROSS_ORIGIN_LOCATION_RETRY_INTERVAL = 100
const CROSS_ORIGIN_LOCATION_TIMEOUT = 2000

const getRemoteLocationFromCrossOriginWindow = (
  autWindow: Window,
  retryInterval: number = CROSS_ORIGIN_LOCATION_RETRY_INTERVAL,
  timeout: number = CROSS_ORIGIN_LOCATION_TIMEOUT,
): Promise<LocationObject> => {
  return new Promise((resolve) => {
    let settled = false
    let intervalId: ReturnType<typeof setInterval>
    let timeoutId: ReturnType<typeof setTimeout>

    const settle = (location: LocationObject) => {
      if (settled) {
        return
      }

      settled = true
      clearInterval(intervalId)
      clearTimeout(timeoutId)
      resolve(location)
    }

    const requestLocation = () => {
      if (settled) {
        return
      }

      // A MessageChannel port can only be transferred once, so create a fresh
      // channel for each attempt.
      const channel = new MessageChannel()

      channel.port1.onmessage = ({ data }) => {
        channel.port1.close()
        settle($Location.create(data))
      }

      try {
        autWindow.postMessage('aut:cypress:location', '*', [channel.port2])
      } catch (e) {
        // The AUT may have navigated away mid-request; a subsequent retry (or
        // the next load event) will attempt again.
      }
    }

    intervalId = setInterval(requestLocation, retryInterval)

    // Fall back to about:blank so the window:load event can still propagate to
    // spec bridges, rather than the page-load wait hanging until pageLoadTimeout.
    // The iframe already fired its load event (that's how we got here) - we just
    // couldn't read the cross-origin url. about:blank is the codebase's existing
    // "unknown / ignore this navigation" sentinel (see navigationChanged), so it
    // unblocks the wait without recording a bogus history entry. Note an empty
    // string would be resolved relative to the current document, yielding a
    // misleading url, so it is intentionally avoided here.
    timeoutId = setTimeout(() => settle($Location.create('about:blank')), timeout)

    requestLocation()
  })
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (state: StateFunc) => ({
  getRemoteLocation (key?: string | undefined, win?: Window) {
    try {
      const remoteUrl = $utils.locToString(win ?? state('window'))
      const location = $Location.create(remoteUrl)

      if (key) {
        return location[key]
      }

      return location
    } catch (e) {
      // it is possible we do not have access to the location
      // for example, if the app has redirected to a different origin
      return ''
    }
  },
  async getCrossOriginRemoteLocation (win?: Window): Promise<LocationObject> {
    const autWindow = win ?? state('window')

    if (!autWindow) {
      return $Location.create('')
    }

    let autLocation: LocationObject

    try {
      const remoteUrl = $utils.locToString(autWindow)

      autLocation = $Location.create(remoteUrl)
    } catch (e) {
      autLocation = await getRemoteLocationFromCrossOriginWindow(autWindow)
    }

    return autLocation
  },
})

export interface ILocation extends ReturnType<typeof create> {}
