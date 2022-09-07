import { $Location, LocationObject } from '../cypress/location'
import type { StateFunc } from '../cypress/state'
import $utils from '../cypress/utils'
import * as cors from '@packages/network/lib/cors'

const getRemoteLocationFromCrossOriginWindow = (autWindow: Window): Promise<LocationObject> => {
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

    let autLocation: LocationObject

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
  isAutSameOrigin (href?: string): boolean {
    const autLocation = href ? $Location.create(href) : Cypress.state('autLocation')

    // Special cases. About blanks is considered same origin as is an undefined AUT.
    if (!autLocation || autLocation?.href === 'about://blank' || autLocation?.href === 'about:blank') {
      return true
    }

    const autOrigin = autLocation?.origin
    const commandOrigin = window.location.origin

    return autOrigin && cors.urlOriginsMatch(commandOrigin, autOrigin)
  },
})

export interface ILocation extends ReturnType<typeof create> {}
