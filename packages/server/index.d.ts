/// <reference path="../../cli/types/cy-blob-util.d.ts" />
/// <reference path="../../cli/types/cy-bluebird.d.ts" />
/// <reference path="../../cli/types/cy-minimatch.d.ts" />
/// <reference path="../../cli/types/lodash/index.d.ts" />
/// <reference path="../../cli/types/sinon/index.d.ts" />
/// <reference path="../../cli/types/jquery/index.d.ts" />
/// <reference path="../../cli/types/mocha/index.d.ts" />

/// <reference path="../../cli/types/cypress-npm-api.d.ts" />

/// <reference path="../../cli/types/net-stubbing.d.ts" />
/// <reference path="../../cli/types/cypress.d.ts" />
/// <reference path="../../cli/types/cypress-global-vars.d.ts" />
/// <reference path="../../cli/types/cypress-type-helpers.d.ts" />

// types for the `server` package
export namespace CyServer {
  // TODO: pull this from main types
  export interface Config {
    blockHosts: string | string[]
    clientRoute: string
    experimentalCspAllowList: boolean | Cypress.experimentalCspAllowedDirectives[]
    experimentalSourceRewriting: boolean
    injectDocumentDomain: boolean
    modifyObstructiveCode: boolean
    experimentalModifyObstructiveThirdPartyCode: boolean
    /**
     * URL to Cypress's runner.
     */
    responseTimeout: number
  }

  export interface Socket {
    toDriver: (eventName: string, ...args: any) => void
  }
}

export default CyServer
