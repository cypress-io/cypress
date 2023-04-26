import { cors, uri } from '@packages/network'
import Debug from 'debug'
import _ from 'lodash'

const DEFAULT_DOMAIN_NAME = 'localhost'
const fullyQualifiedRe = /^https?:\/\//

const debug = Debug('cypress:server:remote-states')

/**
 * Class to maintain and manage the remote states of the server.
 *
 * Example file remote state:
 * {
 *   auth: {
 *     username: 'name'
 *     password: 'pass'
 *   }
 *   origin: "http://localhost:2020"
 *   fileServer: "http://localhost:2021"
 *   strategy: "file"
 *   domainName: "localhost"
 *   props: null
 * }
 *
 * Example http remote state:
 * {
 *   auth: {
 *     username: 'name'
 *     password: 'pass'
 *   }
 *   origin: "https://foo.google.com"
 *   fileServer: null
 *   strategy: "http"
 *   domainName: "google.com"
 *   props: {
 *     port: 443
 *     tld: "com"
 *     domain: "google"
 *     protocol: "https"
 *   }
 * }
 */
export class RemoteStates {
  private remoteStates: Map<string, Cypress.RemoteState> = new Map()
  private primaryOriginKey: string = ''
  private currentOriginKey: string = ''
  private configure: () => { serverPort: number, fileServerPort: number }
  private _config: { serverPort: number, fileServerPort: number } | undefined

  constructor (configure) {
    this.configure = configure
  }

  get (url: string) {
    const state = this.remoteStates.get(cors.getOrigin(url))

    debug('getting remote state: %o for: %s', state, url)

    return _.cloneDeep(state)
  }

  hasPrimary () {
    const remoteStates = Array.from(this.remoteStates.entries())

    return !!(remoteStates.length && remoteStates[0] && remoteStates[0][1])
  }

  getPrimary () {
    const state = Array.from(this.remoteStates.entries())[0][1]

    debug('getting primary remote state: %o', state)

    return state
  }

  isPrimaryOrigin (url: string): boolean {
    return this.primaryOriginKey === cors.getOrigin(url)
  }

  reset () {
    debug('resetting remote state')

    const stateArray = Array.from(this.remoteStates.entries())

    // reset the remoteStates and originStack to the primary
    this.remoteStates = new Map(stateArray[0] ? [stateArray[0]] : [])
    this.currentOriginKey = this.primaryOriginKey
  }

  current (): Cypress.RemoteState {
    return this.get(this.currentOriginKey) as Cypress.RemoteState
  }

  set (urlOrState: string | Cypress.RemoteState, options: { auth?: {} } = {}, isPrimaryOrigin: boolean = true): Cypress.RemoteState {
    let state

    if (_.isString(urlOrState)) {
      const remoteOrigin = uri.origin(urlOrState)
      const remoteProps = cors.parseUrlIntoHostProtocolDomainTldPort(remoteOrigin)

      if ((urlOrState === '<root>') || !fullyQualifiedRe.test(urlOrState)) {
        state = {
          auth: options.auth,
          origin: `http://${DEFAULT_DOMAIN_NAME}:${this.config.serverPort}`,
          strategy: 'file',
          fileServer: _.compact([`http://${DEFAULT_DOMAIN_NAME}`, this.config.fileServerPort]).join(':'),
          domainName: DEFAULT_DOMAIN_NAME,
          props: null,
        }
      } else {
        state = {
          auth: options.auth,
          origin: remoteOrigin,
          strategy: 'http',
          fileServer: null,
          domainName: cors.getDomainNameFromParsedHost(remoteProps),
          props: remoteProps,
        }
      }
    } else {
      state = urlOrState
    }

    const remoteOrigin = cors.getOrigin(state.origin)

    this.currentOriginKey = remoteOrigin

    if (isPrimaryOrigin) {
      // convert map to array
      const stateArray = Array.from(this.remoteStates.entries())

      // set the primary remote state and convert back to map
      stateArray[0] = [remoteOrigin, state]
      this.remoteStates = new Map(stateArray)

      this.primaryOriginKey = remoteOrigin
    } else {
      this.remoteStates.set(remoteOrigin, state)
    }

    debug('setting remote state %o for %s', state, remoteOrigin)

    return this.get(remoteOrigin) as Cypress.RemoteState
  }

  private get config () {
    if (!this._config) {
      this._config = this.configure()
    }

    return this._config
  }
}
