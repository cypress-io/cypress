import { $Location } from '../cypress/location'
import type { StateFunc } from '../cypress/state'
import $utils from '../cypress/utils'

const getRemoteLocationFromCrossOriginWindow = (autWindow: Window) => {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = ({ data }) => {
      channel.port1.close()
      resolve($Location.create(data))
    }

    autWindow.postMessage('cypress-location', '*', [channel.port2])
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
  async getCrossOriginRemoteLocation (key?: string | undefined, win?: Window) {
    const autWindow = win ?? state('window')

    if (!autWindow) {
      return ''
    }

    let autLocation

    try {
      const remoteUrl = $utils.locToString(win ?? state('window'))

      autLocation = $Location.create(remoteUrl)
    } catch (e) {
      autLocation = await getRemoteLocationFromCrossOriginWindow(autWindow)
    }

    if (key) {
      return autLocation[key]
    }

    return autLocation
  },
})

export interface ILocation extends ReturnType<typeof create> {}
