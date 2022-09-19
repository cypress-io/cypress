import { $Location, LocationObject } from '../cypress/location'
import type { StateFunc } from '../cypress/state'
import $utils from '../cypress/utils'

const getRemoteLocationFromCrossOriginWindow = (autWindow: Window): Promise<LocationObject> => {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = ({ data }) => {
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
      if (Cypress.config('experimentalSessionAndOrigin')) {
        autLocation = await getRemoteLocationFromCrossOriginWindow(autWindow)
      } else {
        autLocation = $Location.create('')
      }
    }

    return autLocation
  },
})

export interface ILocation extends ReturnType<typeof create> {}
