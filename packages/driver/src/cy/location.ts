import Debug from 'debug'
import { $Location, LocationObject } from '../cypress/location'
import type { StateFunc } from '../cypress/state'
import $utils from '../cypress/utils'

const debug = Debug('cypress:driver:location')

// this wait has no timeout; when debug logging is enabled, log if no message
// has arrived on the channel after this long
const locationResponseLogTimeoutMs = 2000

const getRemoteLocationFromCrossOriginWindow = (autWindow: Window): Promise<LocationObject> => {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()
    let responseLogTimeout: ReturnType<typeof setTimeout> | undefined

    if (debug.enabled) {
      responseLogTimeout = setTimeout(() => {
        debug('no message received on the channel within %dms of posting aut:cypress:location', locationResponseLogTimeoutMs)
      }, locationResponseLogTimeoutMs)
    }

    channel.port1.onmessage = ({ data }) => {
      if (responseLogTimeout) {
        clearTimeout(responseLogTimeout)
      }

      channel.port1.close()
      resolve($Location.create(data))
    }

    autWindow.postMessage('aut:cypress:location', '*', [channel.port2])
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
