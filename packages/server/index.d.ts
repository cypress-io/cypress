/// <reference path="../../cli/types/cy-blob-util.d.ts" />
/// <reference path="../../cli/types/cy-bluebird.d.ts" />
/// <reference path="../../cli/types/cy-moment.d.ts" />
/// <reference path="../../cli/types/cy-minimatch.d.ts" />
/// <reference path="../../cli/types/lodash/index.d.ts" />
/// <reference path="../../cli/types/sinon/index.d.ts" />
/// <reference path="../../cli/types/jquery/index.d.ts" />

/// <reference path="../../cli/types/cypress-npm-api.d.ts" />

/// <reference path="../../cli/types/net-stubbing.ts" />
/// <reference path="../../cli/types/cypress.d.ts" />
/// <reference path="../../cli/types/cypress-global-vars.d.ts" />
/// <reference path="../../cli/types/cypress-type-helpers.d.ts" />

// types for the `server` package
export namespace CyServer {
  export type getRemoteState = () => RemoteState

  // TODO: pull this from main types
  export interface Config {
    blockHosts: string | string[]
    clientRoute: string
    experimentalSourceRewriting: boolean
    modifyObstructiveCode: boolean
    /**
     * URL to Cypress's runner.
     */
    responseTimeout: number
  }

  export interface RemoteState {
    auth?: {
      username: string
      password: string
    }
    domainName: string
    strategy: 'file' | 'http'
    origin: string
    fileServer: string
    visiting: string
  }

  export interface Socket {
    toDriver: (eventName: string, ...args: any) => void
  }
}

export default CyServer
