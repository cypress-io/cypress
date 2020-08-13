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
