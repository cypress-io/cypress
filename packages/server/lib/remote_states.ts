import { cors } from '@packages/network'
import origin from './util/origin'
import Debug from 'debug'
import _ from 'lodash'
import type { SocketE2E } from './socket-e2e'
import type { SocketCt } from './socket-ct'

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

const DEFAULT_DOMAIN_NAME = 'localhost'
const fullyQualifiedRe = /^https?:\/\//

const debug = Debug('cypress:server:remote-states')

export class RemoteStates {
  private remoteStates: Map<string, Cypress.RemoteState> = new Map()
  private originStack: string[] = []
  private configure: () => { serverPort: string, fileServerPort: string }
  private _config: { serverPort: string, fileServerPort: string } | undefined

  constructor (configure) {
    this.configure = configure
  }

  get (url: string) {
    const state = this.remoteStates.get(cors.getOriginPolicy(url))

    debug('Getting remote state: %o for: %s', state, url)

    return _.cloneDeep(state)
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

  reset () {
    debug('Resetting remote state')

    const stateArray = Array.from(this.remoteStates.entries())

    this.remoteStates = new Map([stateArray[0]])

    this.originStack = [stateArray[0][0]]
  }

  current (): Cypress.RemoteState {
    const state = this.remoteStates.get(this.originStack[this.originStack.length - 1]) as Cypress.RemoteState

    debug('Getting current remote state: %o', state)

    return _.cloneDeep(state)
  }

  set (urlOrState: string | Cypress.RemoteState, options: { auth?: {}, isMultiDomain?: boolean } = {}): Cypress.RemoteState {
    let state

    if (_.isString(urlOrState)) {
      const remoteOrigin = origin(urlOrState)
      const remoteProps = cors.parseUrlIntoDomainTldPort(remoteOrigin)

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

  addSocketListeners (socket: SocketE2E | SocketCt) {
    socket.localBus.on('ready:for:domain', ({ originPolicy, failed }) => {
      if (failed) return

      const existingOrigin = this.remoteStates.get(originPolicy)

      // since this is just the switchToDomain starting, we don't want to override
      // the existing origin if it already exists
      if (!existingOrigin) {
        this.set(originPolicy, { isMultiDomain: true })
      }

      this.addOrigin(originPolicy)
    })

    socket.localBus.on('cross:origin:finished', () => {
      this.removeCurrentOrigin()
    })
  }

  private get config () {
    if (!this._config) {
      this._config = this.configure()
    }

    return this._config
  }

  private addOrigin (originPolicy) {
    this.originStack.push(originPolicy)

    debug('Added origin: ', originPolicy)
  }

  private removeCurrentOrigin () {
    const originPolicy = this.originStack.pop()

    debug('Removed current origin: ', originPolicy)
  }
}
