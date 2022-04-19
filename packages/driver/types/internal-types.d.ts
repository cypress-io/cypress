// NOTE: this is for internal Cypress types that we don't want exposed in the public API but want for development
// TODO: find a better place for this
/// <reference path="./cy/commands/session.d.ts" />
/// <reference path="./cy/logGroup.d.ts" />
/// <reference path="./cypress/log.d.ts" />

interface InternalWindowLoadDetails {
  type: 'same:origin' | 'cross:origin' | 'cross:origin:failure'
  error?: Error
  window?: AUTWindow
}

declare namespace Cypress {
  interface Actions {
    (action: 'internal:window:load', fn: (details: InternalWindowLoadDetails) => void)
    (action: 'net:stubbing:event', frame: any)
    (action: 'request:event', data: any)
    (action: 'backend:request', fn: (...any) => void)
    (action: 'automation:request', fn: (...any) => void)
    (action: 'viewport:changed', fn?: (viewport: { viewportWidth: string, viewportHeight: string }, callback: () => void) => void)
    (action: 'before:screenshot', fn: (config: {}, fn: () => void) => void)
    (action: 'after:screenshot', config: {})
  }

  interface Backend {
    (task: 'ready:for:origin', args: { originPolicy?: string , failed?: boolean}): boolean
    (task: 'cross:origin:finished', originPolicy: string): boolean
  }

  interface cy {
    /**
     * If `as` is chained to the current command, return the alias name used.
     */
    getNextAlias: IAliases['getNextAlias']
    noop: <T>(v: T) => Cypress.Chainable<T>
    queue: CommandQueue
    retry: IRetries['retry']
    state: State
    pauseTimers: ITimer['pauseTimers']
    // TODO: this function refers to clearTimeout at cy/timeouts.ts, which doesn't have any argument.
    // But in many cases like cy/commands/screenshot.ts, it's called with a timeout id string.
    // We should decide whether calling with id is correct or not.
    clearTimeout: ITimeouts['clearTimeout']
    isStable: IStability['isStable']
    isAnticipatingCrossOriginResponseFor: IStability['isAnticipatingCrossOriginResponseFor']
    fail: (err: Error, options:{ async?: boolean }) => Error
    getRemoteLocation: ILocation['getRemoteLocation']
  }

  interface Cypress {
    backend: (eventName: string, ...args: any[]) => Promise<any>
    // TODO: how to pull this from proxy-logging.ts? can't import in a d.ts file...
    ProxyLogging: any
    // TODO: how to pull these from resolvers.ts? can't import in a d.ts file...
    resolveWindowReference: any
    resolveLocationReference: any
    routes: {
      [routeId: string]: any
    }
    sinon: sinon.SinonApi
    utils: CypressUtils
    state: State
    events: Events
    emit: (event: string, payload?: any) => void
    primaryOriginCommunicator: import('../src/multi-domain/communicator').PrimaryOriginCommunicator
    specBridgeCommunicator: import('../src/multi-domain/communicator').SpecBridgeCommunicator
    mocha: $Mocha
    configure: (config: Cypress.ObjectLike) => void
    isCrossOriginSpecBridge: boolean
    originalConfig: Cypress.ObjectLike
  }

  interface CypressUtils {
    throwErrByPath: (path: string, obj?: { args: object }) => void
    warnByPath: (path: string, obj?: { args: object }) => void
    warning: (message: string) => void
  }

  // Extend Cypress.state properties here
  interface State {
    (k: 'activeSessions', v?: Cypress.Commands.Sessions.ActiveSessions):  ActiveSessionsSessionData | undefined
    (k: '$autIframe', v?: JQuery<HTMLIFrameElement>): JQuery<HTMLIFrameElement> | undefined
    (k: 'routes', v?: RouteMap): RouteMap
    (k: 'aliasedRequests', v?: AliasedRequest[]): AliasedRequest[]
    (k: 'document', v?: Document): Document
    (k: 'window', v?: Window): Window
    (k: 'logGroupIds', v?: Array<InternalLogConfig['id']>): Array<InternalLogConfig['id']>
    (k: string, v?: any): any
    state: Cypress.state
  }

  interface InternalConfig {
    (k: keyof ResolvedConfigOptions, v?: any): any
  }

  interface ResolvedConfigOptions {
    $autIframe: JQuery<HTMLIFrameElement>
    document: Document
    projectRoot?: string
  }

  interface RemoteState {
    auth?: Auth
    domainName: string
    strategy: 'file' | 'http'
    origin: string
    fileServer: string | null
    props: Record<string, any>
  }

  interface RuntimeConfigOptions {
    remote: RemoteState
  }
}

type AliasedRequest = {
  alias: string
  request: any
}

// utility types
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
