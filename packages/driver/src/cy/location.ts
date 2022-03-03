import { $Location } from '../cypress/location'
import $utils from '../cypress/utils'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (state) => ({
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
      // for example, if the app has redirected to a 2nd domain
      return ''
    }
  },
})

export interface ILocation extends ReturnType<typeof create> {}
