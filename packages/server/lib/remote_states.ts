import { cors, uri } from '@packages/network'
import Debug from 'debug'
import _ from 'lodash'
import type { ParsedHostWithProtocolAndHost } from '@packages/network/lib/types'
import type { DocumentDomainInjection } from '@packages/network'

export const DEFAULT_DOMAIN_NAME = 'localhost'

const fullyQualifiedRe = /^https?:\/\//

const debug = Debug('cypress:server:remote-states')

export interface RemoteState {
  auth?: {
    username: string
    password: string
  }
  domainName: string
  strategy: 'file' | 'http'
  origin: string
  fileServer: string | null
  props: ParsedHostWithProtocolAndHost | null
}

interface RemoteStatesServerPorts {
  server: number
  fileServer?: number
}

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
  private remoteStates: Map<string, RemoteState> = new Map()
  private primaryOriginKey: string = ''
  private currentOriginKey: string = ''
  private serverPorts?: RemoteStatesServerPorts

  constructor (
    private configure: () => RemoteStatesServerPorts,
    private documentDomainInjection: DocumentDomainInjection,
  ) {
  }

  get (url: string) {
    debug('get (origin key)', this.documentDomainInjection.getOrigin(url), this.remoteStates)
    const state = this.remoteStates.get(this.documentDomainInjection.getOrigin(url))

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

  isPrimarySuperDomainOrigin (url: string): boolean {
    return this.primaryOriginKey === this.documentDomainInjection.getOrigin(url)
  }

  reset () {
    debug('resetting remote state')

    const stateArray = Array.from(this.remoteStates.entries())

    // reset the remoteStates and originStack to the primary
    this.remoteStates = new Map(stateArray[0] ? [stateArray[0]] : [])
    this.currentOriginKey = this.primaryOriginKey
  }

  current (): RemoteState {
    return this.get(this.currentOriginKey) as RemoteState
  }

  private _stateFromUrl (url: string): RemoteState {
    const remoteOrigin = uri.origin(url)
    const remoteProps = cors.parseUrlIntoHostProtocolDomainTldPort(remoteOrigin)

    if ((url === '<root>') || !fullyQualifiedRe.test(url)) {
      return {
        origin: `http://${DEFAULT_DOMAIN_NAME}:${this.ports.server}`,
        strategy: 'file',
        fileServer: _.compact([`http://${DEFAULT_DOMAIN_NAME}`, this.ports.fileServer]).join(':'),
        domainName: DEFAULT_DOMAIN_NAME,
        props: null,
      }
    }

    return {
      origin: remoteOrigin,
      strategy: 'http',
      fileServer: null,
      domainName: cors.getDomainNameFromParsedHost(remoteProps),
      props: remoteProps,
    }
  }

  set (urlOrState: string | RemoteState, options: Pick<RemoteState, 'auth'> = { }, isPrimaryOrigin: boolean = true): RemoteState | undefined {
    const state: RemoteState = _.isString(urlOrState) ?
      {
        ...this._stateFromUrl(urlOrState),
        auth: options.auth,
      } :
      urlOrState

    this.currentOriginKey = this.documentDomainInjection.getOrigin(state.origin)

    if (isPrimaryOrigin) {
      // convert map to array
      const stateArray = Array.from(this.remoteStates.entries())

      // set the primary remote state and convert back to map
      stateArray[0] = [this.currentOriginKey, state]
      this.remoteStates = new Map(stateArray)

      this.primaryOriginKey = this.currentOriginKey
    } else {
      this.remoteStates.set(this.currentOriginKey, state)
    }

    debug('setting remote state %o for %s', state, this.currentOriginKey)

    return this.get(this.currentOriginKey)
  }

  private get ports () {
    if (!this.serverPorts) {
      this.serverPorts = this.configure()
    }

    return this.serverPorts
  }
}
