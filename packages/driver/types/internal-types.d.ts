// NOTE: this is for internal Cypress types that we don't want exposed in the public API but want for development
// TODO: find a better place for this
/// <reference path="./internal-types-lite.d.ts" />
interface InternalWindowLoadDetails {
  type: 'same:origin' | 'cross:origin' | 'cross:origin:failure'
  error?: Error
  window?: AUTWindow
}

declare namespace Cypress {
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
    primaryOriginCommunicator: import('../src/cross-origin/communicator').PrimaryOriginCommunicator
    specBridgeCommunicator: import('../src/cross-origin/communicator').SpecBridgeCommunicator
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
    (k: 'autOrigin', v?: string): string
    (k: 'originCommandBaseUrl', v?: string): string
    (k: 'currentActiveOriginPolicy', v?: string): string
    (k: 'latestActiveOriginPolicy', v?: string): string
    (k: 'duringUserTestExecution', v?: boolean): boolean
    (k: 'onQueueEnd', v?: () => void): () => void
    (k: 'onFail', v?: (err: Error) => void): (err: Error) => void
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
}

type AliasedRequest = {
  alias: string
  request: any
}

// utility types
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
