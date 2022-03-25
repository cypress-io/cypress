import { cors } from '@packages/network'
import origin from './util/origin'
import Debug from 'debug'
import _ from 'lodash'

// {
//   origin: "http://localhost:2020"
//   fileServer:
//   strategy: "file"
//   domainName: "localhost"
//   props: null
// }

// {
//   origin: "https://foo.google.com"
//   strategy: "http"
//   domainName: "google.com"
//   props: {
//     port: 443
//     tld: "com"
//     domain: "google"
//   }
// }
export interface RemoteState {
  auth?: {
    username: string
    password: string
  }
  domainName: string
  strategy: 'file' | 'http'
  origin: string
  fileServer: string | null
  props: Record<string, any>
}

const DEFAULT_DOMAIN_NAME = 'localhost'
const fullyQualifiedRe = /^https?:\/\//

const debug = Debug('cypress:server:remote-states')

export class RemoteStates {
  private remoteStates: Map<string, RemoteState> = new Map()
  private originStack: string[] = []
  private configure: () => { serverPort: string, fileServerPort: string }
  private config: { serverPort: string, fileServerPort: string } | undefined

  constructor (configure) {
    this.configure = configure
  }

  get (url: string) {
    debug('Getting remote state for: ', url)

    return this.remoteStates.get(cors.getOriginPolicy(url))
  }

  isInOriginStack (url: string): boolean {
    return this.originStack.includes(cors.getOriginPolicy(url))
  }

  isSecondaryOrigin (url: string): boolean {
    // start at 1 to exclude the primary origin
    return this.originStack.indexOf(cors.getOriginPolicy(url), 1) !== -1
  }

  isPrimaryOrigin (url: string): boolean {
    return this.originStack[0] === cors.getOriginPolicy(url)
  }

  addOrigin (originPolicy) {
    this.originStack.push(originPolicy)

    debug('Added origin: ', originPolicy)
  }

  removeCurrentOrigin () {
    const originPolicy = this.originStack.pop()

    debug('Removed current origin: ', originPolicy)
  }

  reset () {
    debug('Resetting remote state')

    const stateArray = Array.from(this.remoteStates.entries())

    this.remoteStates = new Map([stateArray[0]])

    this.originStack = [stateArray[0][0]]
  }

  current (): RemoteState {
    const state = this.remoteStates.get(this.originStack[this.originStack.length - 1]) as RemoteState

    debug('Getting current remote state: %o', state)

    return _.cloneDeep(state)
  }

  set (urlOrState: string | RemoteState, options: { auth?: {}, isMultiDomain?: boolean } = {}): RemoteState {
    let state

    if (_.isString(urlOrState)) {
      const remoteOrigin = origin(urlOrState)
      const remoteProps = cors.parseUrlIntoDomainTldPort(remoteOrigin)

      if ((urlOrState === '<root>') || !fullyQualifiedRe.test(urlOrState)) {
        if (!this.config) {
          this.config = this.configure()
        }

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
        } as RemoteState
      }
    } else {
      state = urlOrState
    }

    const remoteOriginPolicy = cors.getOriginPolicy(state.origin)

    if (options.isMultiDomain) {
      this.remoteStates.set(remoteOriginPolicy, state)
    } else {
      // convert map to array
      const stateArray = Array.from(this.remoteStates.entries())

      // set the primary remote state and convert back to map
      stateArray[0] = [remoteOriginPolicy, state]
      this.remoteStates = new Map(stateArray)

      // automatically update the primary origin stack
      this.originStack[0] = remoteOriginPolicy
    }

    debug('Setting remote state %o for %s', state, remoteOriginPolicy)

    return _.cloneDeep(state)
  }
}
