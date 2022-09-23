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
    cy: $Cy
  }

  interface CypressUtils {
    throwErrByPath: (path: string, obj?: { args: object }) => void
    warnByPath: (path: string, obj?: { args: object }) => void
    warning: (message: string) => void
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

interface SpecWindow extends Window {
  cy: $Cy
}

interface CypressRunnable extends Mocha.Runnable {
  type: null | 'hook' | 'suite' | 'test'
  hookId: any
  id: any
  err: any
}
