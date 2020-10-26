// NOTE: this is for internal Cypress types that we don't want exposed in the public API but want for development
// TODO: find a better place for this

declare namespace Cypress {
  interface Actions {
    (action: 'net:event', frame: any)
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
  }

  interface Cypress {
    backend: (eventName: string, ...args: any[]) => Promise<any>
    // TODO: how to pull these from resolvers.ts? can't import in a d.ts file...
    resolveWindowReference: any
    resolveLocationReference: any
    routes: {
      [routeHandlerId: string]: any
    }
    sinon: sinon.SinonApi
    utils: CypressUtils
    state: State
  }

  interface CypressUtils {
    throwErrByPath: (path: string, obj?: { args: object }) => void
    warnByPath: (path: string, obj?: { args: object }) => void
    warning: (message: string) => void
  }

  type Log = ReturnType<Cypress.log>

  interface LogConfig {
    message: any[]
    instrument?: 'route'
    isStubbed?: boolean
    alias?: string
    aliasType?: 'route'
    type?: 'parent'
    event?: boolean
    method?: string
    url?: string
    status?: number
    numResponses?: number
    response?: string | object
    renderProps?: () => {
      indicator?: 'aborted' | 'pending' | 'successful' | 'bad'
      message?: string
    }
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

  // Extend Cypress.state properties here
  interface ResolvedConfigOptions {
    $autIframe: JQuery<HTMLIFrameElement>
    document: Document
  }
}

type AliasedRequest = {
  alias: string
  request: any
}
