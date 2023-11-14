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
    Location: {
      create: (url: string) => ({ domain: string, superDomain: string })
    }
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

  interface Actions {
    (action: 'set:cookie', fn: (cookie: SerializableAutomationCookie) => void)
    (action: 'clear:cookie', fn: (name: string) => void)
    (action: 'clear:cookies', fn: () => void)
    (action: 'cross:origin:cookies', fn: (cookies: SerializableAutomationCookie[]) => void)
    (action: 'before:stability:release', fn: () => void)
    (action: 'paused', fn: (nextCommandName: string) => void)
  }

  interface Backend {
    (task: 'cross:origin:cookies:received'): Promise<void>
    (task: 'get:rendered:html:origins'): Promise<string[]>
  }
}

declare namespace InternalCypress {
  interface Cypress extends Cypress.Cypress, NodeEventEmitter {
    backend: (eventName: string, ...args: any[]) => Promise<any>
  }

  interface LocalStorage extends Cypress.LocalStorage {
    setStorages: (local, remote) => LocalStorage
    unsetStorages: () => LocalStorage
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
  hookName: string
  id: any
  err: any
  // Added by Cypress to Tests in order to calculate continue conditions for retries
  calculateTestStatus?: () => {
    strategy: 'detect-flake-and-pass-on-threshold' | 'detect-flake-but-always-fail' | undefined
    shouldAttemptsContinue: boolean
    attempts: number
    outerStatus: 'passed' | failed
  }
  // Added by Cypress to Tests in order to determine if the experimentalRetries test run passed so we can leverage in the retry logic.
  hasAttemptPassed?: boolean
}
