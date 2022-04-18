// NOTE: this is for internal Cypress types that we don't want exposed in the public API but want for development
// TODO: find a better place for this
/// <reference path="./cy/commands/session.d.ts" />
/// <reference path="./cy/logGroup.d.ts" />
/// <reference path="./cypress/log.d.ts" />

declare namespace Cypress {
  interface Actions {
    (action: 'net:stubbing:event', frame: any)
    (action: 'request:event', data: any)
  }

  interface cy {
    /**
     * If `as` is chained to the current command, return the alias name used.
     */
    getNextAlias: () => string | undefined
    noop: <T>(v: T) => Cypress.Chainable<T>
    queue: any
    retry: (fn: () => any, opts: any) => any
    state: State
    pauseTimers: <T>(shouldPause: boolean) => Cypress.Chainable<T>
    // TODO: this function refers to clearTimeout at cy/timeouts.ts, which doesn't have any argument.
    // But in many cases like cy/commands/screenshot.ts, it's called with a timeout id string.
    // We should decide whether calling with id is correct or not.
    clearTimeout: <T>(timeoutId?: string) => Cypress.Chainable<T>
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
    originalConfig: Record<string, any>
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

  interface ResolvedConfigOptions {
    $autIframe: JQuery<HTMLIFrameElement>
    document: Document
  }
}

type AliasedRequest = {
  alias: string
  request: any
}
