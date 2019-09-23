// types for the `server` package

export namespace CyServer {
  export type getRemoteState = () => RemoteState

  export interface Config {
    blacklistHosts: string | string[]
    clientRoute: string
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

  export interface Socket {}
}

export as namespace CyServer

export = CyServer
