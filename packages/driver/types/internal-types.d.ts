// NOTE: this is for internal Cypress types that we don't want exposed in the public API but want for development
// TODO: find a better place for this

interface InternalWindowLoadDetails {
  type: 'same:domain' | 'cross:domain' | 'cross:domain:failure'
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
    (task: 'ready:for:domain', args: { originPolicy?: string , failed?: boolean}): boolean
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
    isAnticipatingMultiDomainFor: IStability['isAnticipatingMultiDomainFor']
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
    multiDomainCommunicator: import('../src/multi-domain/communicator').PrimaryDomainCommunicator
    specBridgeCommunicator: import('../src/multi-domain/communicator').SpecBridgeDomainCommunicator
    mocha: $Mocha
    configure: (config: Cypress.ObjectLike) => void
    isMultiDomain: boolean
    originalConfig: Cypress.ObjectLike
  }

  interface CypressUtils {
    throwErrByPath: (path: string, obj?: { args: object }) => void
    warnByPath: (path: string, obj?: { args: object }) => void
    warning: (message: string) => void
  }

  type Log = ReturnType<Cypress.log>

  type ReferenceAlias = {
    cardinal: number,
    name: string,
    ordinal: string,
  }

  type Snapshot = {
    body?: {get: () => any},
    htmlAttrs?: {[key: string]: any},
    name?: string
  }

  type ConsoleProps = {
    Command?: string
    Snapshot?: string
    Elements?: number
    Selector?: string
    Yielded?: HTMLElement
    Event?: string
    Message?: string
    actual?: any
    expected?: any
  }

  type RenderProps = {
    indicator?: 'aborted' | 'pending' | 'successful' | 'bad'
    message?: string
  }

  interface LogConfig {
    $el?: jQuery<any> | string
    message: any
    instrument?: 'route' | 'command'
    isStubbed?: boolean
    alias?: string
    aliasType?: 'route'
    referencesAlias?: ReferenceAlias[]
    chainerId?: string
    commandName?: string
    coords?: {
      left: number
      leftCenter: number
      top: number
      topCenter: number
      x: number
      y: number
    }
    count?: number
    callCount?: number
    type?: 'parent' | 'child'
    event?: boolean
    end?: boolean
    ended?: boolean
    expected?: string
    functionName?: string
    name?: string
    id?: string
    hookId?: number
    method?: string
    url?: string
    status?: number
    state?: "failed" | "passed" | "pending" // representative of Mocha.Runnable.constants (not publicly exposed by Mocha types)
    numResponses?: number
    numElements?: number
    numResponses?: number
    response?: string | object
    testCurrentRetry?: number
    timeout?: number
    testId?: string
    err?: Error
    error?: Error
    snapshot?: boolean
    snapshots?: []
    selector?: any
    viewportHeight?: number
    viewportWidth?: number
    visible?: boolean
    wallClockStartedAt?: string
    renderProps?: () => RenderProps | RenderProps
    consoleProps?: () => Command | Command
    browserPreRequest?: any
  }

  interface State {
    (k: '$autIframe', v?: JQuery<HTMLIFrameElement>): JQuery<HTMLIFrameElement> | undefined
    (k: 'routes', v?: RouteMap): RouteMap
    (k: 'aliasedRequests', v?: AliasedRequest[]): AliasedRequest[]
    (k: 'document', v?: Document): Document
    (k: 'window', v?: Window): Window
    (k: string, v?: any): any
    state: Cypress.state
  }

  interface InternalConfig {
    (k: keyof ResolvedConfigOptions, v?: any): any
  }

  // Extend Cypress.state properties here
  interface ResolvedConfigOptions {
    $autIframe: JQuery<HTMLIFrameElement>
    document: Document
    projectRoot?: string
  }
}

type AliasedRequest = {
  alias: string
  request: any
}

// utility types
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
